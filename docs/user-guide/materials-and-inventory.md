# Materials and inventory

This chapter covers the **Resources** module: materials, storage locations, indents, purchase orders,
goods receipts, site transfers, material consumption and stock adjustments. Everything except stock
adjustments is in the sidebar under Resources; stock adjustments are reached by their address, and
the section on them says how.

Read the first two sections before using the module. They describe where a stock figure actually
lives and which action actually moves it, and almost every confusing result in this area comes from
one of the two.

## Contents

- [Where stock lives](#where-stock-lives)
- [What moves stock and when](#what-moves-stock-and-when)
- [Who can do what](#who-can-do-what)
- [Setting up: storage locations](#setting-up-storage-locations)
- [Setting up: materials](#setting-up-materials)
- [The procurement chain: indent, purchase order, goods receipt](#the-procurement-chain-indent-purchase-order-goods-receipt)
- [Issuing material to the work: consumption](#issuing-material-to-the-work-consumption)
- [Moving material between sites: site transfer](#moving-material-between-sites-site-transfer)
- [Correcting a balance: stock adjustment](#correcting-a-balance-stock-adjustment)
- [Reading the numbers](#reading-the-numbers)
- [Document numbers](#document-numbers)
- [Things that will surprise you](#things-that-will-surprise-you)

## Where stock lives

There is no single "stock of cement". A balance is held per **material, per project, per storage
location**, and every figure you see is one of those rows or a sum of several.

The storage location on a balance row can be empty, and this is the part that catches people out.
A row with no storage location is a real balance in its own right, the project's unlocated stock. It
is not a total of the located rows underneath it. So a project can hold:

| Material | Project | Storage location | Quantity |
| -------- | ------- | ---------------- | -------- |
| Cement   | Tower B | Site store       | 40       |
| Cement   | Tower B | (none)           | 12       |

That project holds 52 bags in total, in two separate balances. A consumption or transfer that names
the site store is checked against the 40 and can only draw on the 40. One that names no location is
checked against the 12.

Two consequences worth carrying around:

- **A material can look plentiful and still be unavailable.** The organization-wide figure on the
  materials list is a sum across every project and location. The figure that decides whether your
  entry succeeds is the single row you are writing against. The consumption and transfer forms show
  you that row's figure once you have chosen a project, which is why they say "Choose a project to
  see the stock available" until you do.
- **Where you put stock is where you must take it from.** Receiving into the site store and then
  consuming with no location named will fail on insufficient stock even though the project clearly
  has the material.

A storage location that names a project can only be used from that project. A storage location that
names no project is an organization-level store, and any project may draw on it.

## What moves stock and when

This is the rule that surprises people most, so it is stated plainly:

> Goods receipts, site transfers, consumptions, and a material created with an opening stock, all
> move stock **the moment you create them**. Stock adjustments move stock **only when they are
> approved**. Nothing else in this module moves stock at all.

In particular:

- Approving a purchase order moves no stock. Nothing about a purchase order moves stock.
- Marking a site transfer as Completed moves no stock. The stock already moved when the transfer was
  created.
- An indent moves no stock at any point.

Every movement writes a line to an append-only stock ledger, which records the material, the opening
balance, the signed change, the closing balance, the transaction type, the reference document number
and who did it. That ledger is what the **Movement History** tab on a material shows. Nothing deletes
a ledger line, so a mistake is corrected by posting the opposite movement, not by removing the
original.

Values are held alongside quantities. Stock coming in at a stated unit cost adds that cost to the
value of the row. Stock going out is valued at the row's weighted average cost, which is its value
divided by its quantity.

## Who can do what

Access in this module is coarse, and coarser than the sidebar suggests.

**Most screens under Resources are restricted to the `system-admin` role in the web app, including
simply viewing a list.** That is materials, storage locations, indents, purchase orders, goods
receipts, site transfers, material consumptions, inventory transactions and vendors. The sidebar shows
these links to everybody, so a site engineer or storekeeper sees Materials in the menu, opens it and
gets a permission error. This is worth telling a new user before they hit it.

The practical effect is that a storekeeper cannot book a goods receipt and a site engineer cannot
record what they used unless they are made a system administrator of the organization, which grants
them everything else as well. There is no narrower role for stores work today.

**Stock adjustments and assets** are the two exceptions, and both have the same two-role model:

| Action               | Who                                                                       |
| -------------------- | ------------------------------------------------------------------------- |
| View                 | Any member of the organization, plus `system-admin` and `project-manager` |
| Create, edit, delete | `system-admin` or `project-manager`                                       |
| Approve, reject      | `system-admin` or `project-manager`                                       |

## Setting up: storage locations

**Resources > Storage Locations**

A storage location is a place stock can sit: a site store, a warehouse, a godown, the head office or
a processing plant.

1. Give it a name and a type. The types are Project Site, Warehouse, Godown, Head Office, Processing
   Plant and Others.
2. Decide whether to attach it to a project. **This is the decision that matters.** A location
   attached to a project can only be used from that project. A location with no project is an
   organization-level store that every project can draw on.
3. Address, capacity and coordinates are optional. Capacity is free text, so it is a note to a human
   rather than a limit the product enforces. Nothing stops you receiving more into a location than
   its stated capacity.
4. A location can be marked inactive rather than deleted.

Set your locations up before you start receiving material. Moving a balance to a different location
afterwards means a stock adjustment or a transfer, not an edit.

## Setting up: materials

**Resources > Materials > New Material**

A material is the item itself, defined once for the organization. Balances hang off it per project
and location.

### Identity and tax

Name and unit are required. SKU, description, HSN code and GST rate are optional and are carried onto
purchase orders and invoices where they apply.

### Stock policy

You enter three source figures and the product derives three levels from them:

| You enter                    | Meaning                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| Safety Stock                 | The buffer you never want to eat into                              |
| Lead Time Consumption (LTC)  | How much you get through while a replenishment order is in transit |
| Minimum Order Quantity (MOQ) | The smallest quantity the vendor will supply                       |

From those:

```text
Min Stock     = Safety Stock + LTC
Reorder Level = Min Stock + LTC
Max Stock     = Reorder Level + MOQ - LTC        (never below zero)
```

The three derived fields are shown tinted and marked `(auto)`. You can type over any of them, at
which point that field stops following the formula and an **Auto** button appears to put it back.

**These levels are indicators, not alarms.** The material list and the material page show a warning
badge when a balance is at or below the reorder level. Nothing else happens. No email is sent, no
notification is raised, no indent is created, and no scheduled job looks for materials that have
fallen below their level. If nobody opens the screen, nobody finds out.

Levels can also be set per storage location, so a warehouse and a site store can carry different
reorder points for the same material. Note that saving a per-location set of levels replaces all five
values: a field you leave out is cleared rather than left as it was.

### Opening stock

The **Stock and Location** panel with Opening Stock, unit cost, storage location and project appears
**only when you are creating a material**. Edit an existing material and it is not there.

An opening stock greater than zero writes an Opening Balance line to the ledger at the project and
location you name. If you skip it at creation, the way to establish a starting balance afterwards is a
goods receipt or an approved stock adjustment.

## The procurement chain: indent, purchase order, goods receipt

The intended sequence is that a site raises an indent for what it needs, the purchase office turns
that into a purchase order to a vendor, and the store records a goods receipt when the material
arrives. Only the last of the three touches stock.

**The chain is not automated.** Each step is a document you create by hand and link to the one before
it. Nothing advances on its own, and the statuses on indents and purchase orders are labels a person
sets, not states the product moves through. There is no validation on those transitions, so a
purchase order can go from Draft straight to Fully Received if somebody picks that from the menu.

### Indent

**Resources > Indents > New Indent**

An indent is a request from a site for material. It records the project, an expected date, remarks and
a list of materials with the quantity requested against each.

- The indent number is allocated by the server. The form does not ask for one.
- Statuses are Pending, Ordered, On Site, Delayed and Cancelled. They are labels you set. Nothing sets
  them for you, so an indent that has been fully ordered and delivered still reads Pending unless
  somebody changes it.
- An indent moves nothing and reserves nothing. Raising an indent for 100 bags does not hold 100 bags
  against anyone else's use.

### Purchase order

**Resources > Purchase Orders > New Purchase Order**

A purchase order is the instruction to a vendor. The header carries the vendor, the project and,
optionally, the indent it answers. Each line carries a material, an ordered quantity and a unit price,
and shows the material's current stock beside it so an order for something you already hold is visible
while you type.

- The purchase order number is allocated by the server. The form does not ask for one.
- **A purchase order is always created as Draft.** The product refuses any other status on creation
  and tells you to move it afterwards. After that, any status can be set to any other with no checks.
- Line totals and the order total are computed from quantity times unit price. A total sent from
  anywhere else is ignored, so the figure on the screen is always the arithmetic of the lines.
- Approving a purchase order records nothing beyond the label. There is no approver stamp, no second
  pair of eyes, and no value threshold above which a larger order needs a different signature.
- Raising a purchase order from an indent marks the indent lines as converted. It does **not** move
  the indent to Ordered, and it does not fill in the linked purchase order number on the indent line.
  Both remain jobs for a person.

### Goods receipt (GRN)

**Resources > GRN > New GRN**

A goods receipt records what actually arrived, and it is the step that puts stock into the system.

Fields: Received On, Vendor, Purchase Order, Project, Storage Location, Delivery Challan number,
Invoice number, Invoice amount and remarks, then a line per material with the ordered quantity, the
received quantity and a unit cost.

Points to get right:

- **Choose the storage location deliberately.** The receipt is what decides which balance row the
  material lands in, and it is easier to get right here than to correct later. Leaving it empty puts
  the stock in the project's unlocated row, which is a real balance and not a general pool.
- **A goods receipt has no status and no approval.** It is created and the stock is in. There is
  nothing to approve and no way to reverse it from the goods receipt screen. A receipt entered wrongly
  is corrected with a stock adjustment.
- **The ordered quantity on the line is a note, not a check.** It is whatever you type. It is not read
  from the purchase order and it is not compared against it, so a receipt for more than was ordered
  goes through without comment.
- **The purchase order is not updated.** Its received quantities stay at zero and its status stays
  where you left it, however many receipts you book against it. Moving a purchase order to Partially
  Received or Fully Received is something a person does by hand.
- The goods receipt number is allocated by the server.
- **Purchase Order and Project are both required.** The server resolves each one and refuses the
  receipt if it cannot. The form used to mark them optional and offer a None that was then rejected;
  they now carry the required marker and no None. Only the storage location is genuinely optional, and
  leaving it out means the unlocated balance rather than no balance.

## Issuing material to the work: consumption

**Resources > Material Consumptions > New Consumption**

A consumption records material used up. It takes the stock out immediately.

Fields: consumption date, type, material, quantity, project, storage location, an optional task, and
details. The two types are **Used from Stock** and **Transferred**.

- The figure shown beside the material is the balance at the project and location you have chosen, not
  the organization total, and it is the figure the entry is checked against. If it says zero, the
  entry will be refused however much the material list shows elsewhere.
- Starting a consumption from a task fixes the project to that task's project and shows it read only.
  A task must belong to the project the consumption is against.
- A consumption has no status and no approval. It is recorded and the stock is gone.

## Moving material between sites: site transfer

**Resources > Site Transfers > New Transfer**

A transfer moves stock from one project and location to another.

The form takes a sending project and location, a receiving project and location, and the materials and
quantities being sent. Each line shows the sending side's balance so a shortage is visible before you
submit.

What actually happens:

- **Both ends of the movement are written the moment the transfer is created.** The stock leaves the
  sending row and arrives in the receiving row in the same step. It does not sit in transit, and the
  receiving site does not confirm anything for the stock to arrive.
- The receiving row inherits the sending row's average cost, so moving material between sites does not
  change what the organization thinks its stock is worth.
- **A transfer cannot be edited or deleted.** The screen says so. Correct one with another transfer in
  the opposite direction, or with a stock adjustment.
- The three statuses, Pending, Partially Transferred and Completed, are a delivery note for humans.
  Moving through them moves no stock and reconciles no quantities, and there is nowhere to record that
  the receiving site took delivery of less than was sent.
- A transfer is refused if the two sides resolve to the same balance row, meaning the same project and
  the same location. Two different locations inside one project is a legal transfer.
- The transfer number is allocated by the server, and only once the transfer has passed validation, so
  a rejected attempt does not consume a number.

## Correcting a balance: stock adjustment

A stock adjustment is how a balance is brought into line with a physical count, and how every other
mistake in this module is fixed. It is the only document here with a real approval.

### Getting to it

Resources, then Stock Adjustments. The direct address is:

```text
/users/dashboard/resources/stock-adjustments
```

The sidebar entry is recent. Until it was added, the pages existed and worked but nothing anywhere
linked to them, so the module was reachable only by typing that address.

### Raising one

An adjustment carries a type, a project, an effective date, a primary reason, a justification and a
list of lines. Each line names a material, the quantity physically counted, and a reason.

**Current Stock on a line is shown, not typed.** It is the balance the system holds for that material
at the document's project and storage location, and it is read from the stock record every time the
document is saved. Pick the project, the storage location and the material and the figure appears; the
difference and the value beside it follow from it. Until all three are chosen there is no balance to
read and the field says so.

The figure is worth watching, because it is the one the approval is checked against. If it reads
"Not available", your account cannot read material stock and the form has nothing to show you; the
document still saves and the server still records the right balance on it.

Types are increase, decrease, correction, write off, return and recount. Reasons are physical count,
damaged, expired, lost, found, obsolete, vendor return, quality issue, data error, theft, donation,
sample and other.

Two fields are required and are the ones people leave out: **a justification on the document**, and
**a reason on every line or a primary reason on the header** for the lines to fall back to.

Unlike the other documents in this module, **the adjustment number is yours to type**. Nothing
allocates it and nothing checks it is unique, so two adjustments can carry the same number. Left blank,
the ledger records the adjustment by its internal id instead.

### What approval does

Nothing happens until somebody approves it. A draft adjustment sits there and the balance is untouched.
You cannot edit your way past this: the product refuses to save an adjustment in any status other than
draft and tells you to use the approve action.

On approval, in one step:

1. Every line is checked against the balance it was raised with. If any balance has moved since then,
   the whole approval is refused. See below.
2. Each line's movement is the counted figure minus that balance, which is the arithmetic the document
   shows.
3. A line whose movement works out to nothing is zeroed and skipped, and writes no ledger line.
4. The ledger lines are written and the balances move.
5. The document is stamped with who approved it and when, and is frozen.

An approval is refused, with the reason shown, when the adjustment names no project, has no lines, has
a line with no material, has a line with no reason, has a line that would take a balance below zero,
or sits on a balance that has moved since it was raised.

Approving runs once and the document is frozen afterwards. A posted adjustment cannot be edited or
deleted. Correct it with another adjustment.

### When the balance moves before approval

If stock moves between the count and the approval, the approval is refused. The message names both
figures: the balance the line was raised against, and the balance as it stands now.

The way forward is short. Open the document and save it again, which reads the current balance onto
every line, check the count against the figure it now stands at, and approve. Editing the count first
is fine and is often the point: somebody has to decide whether the goods that arrived were already on
the shelf when the count was taken.

That decision is why the product stops rather than carrying on. Posting the drafted variance would be
a guess about exactly that question, and nothing in the data can answer it: the same figures fit a
delivery that was counted and a delivery that arrived afterwards, and guessing wrong either swallows a
real receipt or counts it twice. Approval is the one moment a second person is standing over the
document, so it is where the question gets asked.

It only happens when the balance actually moved. A quiet store approves as it always did.

The delay is what makes it likely, not the size of the adjustment. A count sheet raised in the morning
and approved after lunch has a whole morning of deliveries and issues to survive. Approving the same
day you count is the practical answer.

One thing this is not: a line that carries several rows for the same material and location does not
refuse itself. The document's own postings are discounted, so splitting one shelf's variance across a
line per reason approves in one pass.

### Who may approve

Approving is restricted to `system-admin` and `project-manager`, and **the person who raised the
adjustment cannot approve it**. It is the second pair of eyes on a movement nobody else has checked.

The single exception is a `system-admin`, who may approve an adjustment they raised themselves. When
that happens the screen says so before you press the button, and the ledger line carries a note that
it was raised and approved by the same person.

The approve button behaves accordingly. It is absent when you do not hold a role that can approve, and
absent once the document is decided. It is present but disabled, with the reason next to it, when you
raised the document yourself and are not a system administrator, or when the document is missing
something approval needs.

### Rejecting

Rejecting refuses the adjustment and records who refused it, when, and why. A reason is required and is
capped at 500 characters. It moves no stock.

**You may reject your own adjustment**, which is the one place the second-pair-of-eyes rule does not
apply. A rejection posts nothing to the ledger, and the same person could delete their own draft
anyway, which keeps no record at all. Rejecting and stating why is the better of the two.

A rejection is final. A rejected adjustment cannot be edited, deleted, approved or rejected again. The
way forward is a fresh adjustment that answers the objection.

## Reading the numbers

**Resources > Materials** lists every material with its organization-wide stock and flags anything at
or below its reorder level.

Opening a material gives three tabs:

- **Overview**: the material's identity, tax fields and the stock levels described above.
- **Stock by Location**: the individual balance rows, which is the view that answers "where is it
  actually". The count of locations is shown on the tab.
- **Movement History**: the ledger for that material, every movement with its opening balance, change,
  closing balance, document reference and date. This is the record to reach for when a figure is
  disputed.

## Document numbers

Indent, purchase order, goods receipt and site transfer numbers are allocated by the server. The forms
no longer ask for them.

The format is a prefix, the calendar year and a six-digit sequence, counted per organization:

| Document       | Example           |
| -------------- | ----------------- |
| Indent         | `IND-2026-000001` |
| Purchase order | `PO-2026-000001`  |
| Goods receipt  | `GRN-2026-000001` |
| Site transfer  | `TRF-2026-000001` |

The year is the calendar year, not the financial year, so the sequence restarts on 1 January and not
on 1 April. Finance documents number themselves separately and do use the April to March year, so the
two families of numbers are not comparable.

Numbers are allocated as part of the same operation that saves the document. A save that fails returns
its number, so the sequence does not leave gaps behind failed attempts.

Two exceptions:

- A **stock adjustment** number is typed by the user, is not allocated and is not checked for
  duplicates.
- An **indent** number, once allocated, can be overwritten when the indent is edited. The product only
  checks that the new number is not already in use in the organization. No other document in this
  module allows this.

## Things that will surprise you

A consolidated list, because each of these has caught somebody out.

1. **A stock adjustment does nothing until it is approved**, and the person who raised it cannot
   approve it unless they hold `system-admin`.
2. **A stock adjustment is refused if the balance moved after it was raised.** Save it again to take up
   the current balance, check the count against it, then approve.
3. **Goods receipts, transfers and consumptions post immediately.** There is no approval step and no
   undo.
4. **A goods receipt does not update its purchase order.** Received quantities on the order stay at
   zero and its status never changes on its own.
5. **A goods receipt does not check what was ordered.** Receiving more than the purchase order says is
   accepted silently.
6. **A site transfer moves both ends at once.** Marking it Completed later does nothing, and there is
   nowhere to record a short delivery.
7. **Site transfers cannot be edited or deleted.**
8. **The unlocated balance is a real balance, not a total.** Receiving into a location and consuming
   without one will fail on insufficient stock.
9. **Reorder levels raise no alerts.** They colour a badge on a screen somebody has to open.
10. **Opening stock can only be set when the material is created.**
11. **Saving per-location stock levels replaces all five.** A field left blank is cleared.
12. **Most of Resources is `system-admin` only in the web app, including reading it**, while the
    sidebar shows the links to everyone. The two exceptions are Stock Adjustments and Assets, which
    any member of the organization can read and a project manager can write. Materials, storage
    locations, indents, purchase orders, goods receipts, site transfers, consumptions, inventory
    transactions and vendors are all admin-only end-to-end.
13. **Purchase order and indent statuses are labels.** Nothing validates a transition and nothing sets
    them for you.
14. **There is no value threshold on a purchase order approval.** A large order and a small one take
    the same single click, from anyone who can reach the screen.
15. **A stock adjustment number can repeat.** It is typed, not allocated.

## Not in the product yet

Named here so nobody goes looking:

- No accepted or rejected split on a goods receipt line. A receipt records what was received, and
  material refused at the gate has to be handled as a smaller received quantity or a later adjustment.
- No received quantity on a site transfer line, so a short delivery between sites cannot be recorded as
  such.
- No low-stock notification, report or scheduled check.
- No reservation of stock against an indent or an open purchase order. Available stock is what is on
  hand, not what is on hand less what is spoken for.
