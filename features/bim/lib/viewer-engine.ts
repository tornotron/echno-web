/**
 * The three.js / That Open Components side of the BIM viewer.
 *
 * Loaded only through a dynamic import from the viewer shell, so three, the
 * components library and its web-ifc dependency stay out of the main chunk.
 * The engine knows nothing about React or the backend: it takes presigned
 * tile urls, adds the meshes to one world per storey, raycasts a click to the
 * GlobalId the worker wrote on every node, and frames an element on request.
 *
 * Tiles are the worker's glTF 2.0 binaries: one node and mesh per element,
 * the GlobalId as the node name and as `extras.globalId` (which GLTFLoader
 * surfaces on `userData`). The worker does not Draco-compress yet, so no
 * decoder is registered; add a DRACOLoader (and its wasm under `public/`)
 * when it does.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as OBC from '@thatopen/components';

export interface ViewerEngine {
  /** Fetches a tile and adds it to the scene under `key`. Idempotent per key. */
  loadTile(key: string, url: string): Promise<void>;
  /** Removes a tile's meshes from the scene and frees their geometry. */
  unloadTile(key: string): void;
  /** Which tiles are currently loaded. */
  loadedTiles(): string[];
  /** Show or hide a loaded tile without unloading it. */
  setTileVisible(key: string, visible: boolean): void;
  /** Called with the GlobalId under a click, or `undefined` for empty space. */
  onPick(handler: (globalId: string | undefined) => void): () => void;
  /** Highlights one element (or clears the highlight) and optionally frames it. */
  select(globalId: string | undefined, frame?: boolean): boolean;
  /** Frames every loaded tile. */
  fitAll(): void;
  /** Adds a section plane at the last click, or clears them all. */
  toggleSectionPlane(): void;
  clearSectionPlanes(): void;
  dispose(): void;
}

export type CreateViewerEngine = (container: HTMLElement) => ViewerEngine;

const HIGHLIGHT = new THREE.MeshLambertMaterial({
  color: 0xF5_9E_0B,
  emissive: 0x7C_2D_12,
  emissiveIntensity: 0.35,
});

function globalIdOf(object: THREE.Object3D | null): string | undefined {
  let current: THREE.Object3D | null = object;
  while (current) {
    const fromExtras = current.userData?.globalId;
    if (typeof fromExtras === 'string' && fromExtras) return fromExtras;
    if (current.name && current.name.length === 22) return current.name;
    current = current.parent;
  }
  return undefined;
}

export function createViewerEngine(container: HTMLElement): ViewerEngine {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.OrthoPerspectiveCamera,
    OBC.SimpleRenderer
  >();
  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.OrthoPerspectiveCamera(components);
  components.init();
  world.scene.setup();
  world.scene.three.background = null;

  const casters = components.get(OBC.Raycasters);
  const caster = casters.get(world);
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = true;

  const loader = new GLTFLoader();
  const tiles = new Map<string, THREE.Group>();
  const meshesByGlobalId = new Map<string, THREE.Mesh[]>();
  const originalMaterials = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const pickHandlers = new Set<(globalId: string | undefined) => void>();
  let selected: string | undefined;
  let lastPointerDown: { x: number; y: number; at: number } | undefined;

  function allMeshes(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const group of tiles.values()) {
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh && obj.visible) out.push(obj as THREE.Mesh);
      });
    }
    return out;
  }

  function fit(objects: THREE.Object3D[]) {
    if (objects.length === 0) return;
    const box = new THREE.Box3();
    for (const obj of objects) box.expandByObject(obj);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const controls = world.camera.controls;
    void controls.fitToSphere(sphere, true);
  }

  function restore(mesh: THREE.Mesh) {
    const original = originalMaterials.get(mesh);
    if (original) mesh.material = original;
  }

  const onPointerDown = (event: PointerEvent) => {
    lastPointerDown = { x: event.clientX, y: event.clientY, at: Date.now() };
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!lastPointerDown) return;
    const moved =
      Math.abs(event.clientX - lastPointerDown.x) > 4 ||
      Math.abs(event.clientY - lastPointerDown.y) > 4;
    const slow = Date.now() - lastPointerDown.at > 400;
    lastPointerDown = undefined;
    if (moved || slow || event.button !== 0) return;
    const hit = caster.castRayToObjects(allMeshes());
    const globalId = hit ? globalIdOf(hit.object) : undefined;
    for (const handler of pickHandlers) handler(globalId);
  };
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointerup', onPointerUp);

  const engine: ViewerEngine = {
    async loadTile(key, url) {
      if (tiles.has(key)) return;
      const gltf = await loader.loadAsync(url);
      if (tiles.has(key)) return;
      const group = gltf.scene;
      group.name = key;
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const id = globalIdOf(mesh);
        if (!id) return;
        const list = meshesByGlobalId.get(id) ?? [];
        list.push(mesh);
        meshesByGlobalId.set(id, list);
        if (selected === id) {
          originalMaterials.set(mesh, mesh.material);
          mesh.material = HIGHLIGHT;
        }
      });
      tiles.set(key, group);
      world.scene.three.add(group);
      if (tiles.size === 1) fit([group]);
    },

    unloadTile(key) {
      const group = tiles.get(key);
      if (!group) return;
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const id = globalIdOf(mesh);
        if (id) {
          const rest = (meshesByGlobalId.get(id) ?? []).filter((m) => m !== mesh);
          if (rest.length > 0) meshesByGlobalId.set(id, rest);
          else meshesByGlobalId.delete(id);
        }
        mesh.geometry.dispose();
      });
      world.scene.three.remove(group);
      tiles.delete(key);
    },

    loadedTiles: () => [...tiles.keys()],

    setTileVisible(key, visible) {
      const group = tiles.get(key);
      if (group) group.visible = visible;
    },

    onPick(handler) {
      pickHandlers.add(handler);
      return () => pickHandlers.delete(handler);
    },

    select(globalId, frame = false) {
      if (selected) {
        for (const mesh of meshesByGlobalId.get(selected) ?? []) restore(mesh);
      }
      selected = globalId;
      if (!globalId) return false;
      const meshes = meshesByGlobalId.get(globalId) ?? [];
      for (const mesh of meshes) {
        originalMaterials.set(mesh, mesh.material);
        mesh.material = HIGHLIGHT;
      }
      if (frame && meshes.length > 0) fit(meshes);
      return meshes.length > 0;
    },

    fitAll() {
      fit([...tiles.values()]);
    },

    toggleSectionPlane() {
      if (clipper.list.size > 0) {
        clipper.deleteAll();
        return;
      }
      clipper.create(world);
    },

    clearSectionPlanes() {
      clipper.deleteAll();
    },

    dispose() {
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      for (const key of tiles.keys()) engine.unloadTile(key);
      pickHandlers.clear();
      components.dispose();
    },
  };

  return engine;
}
