# ChantierOS — Margin & Profitability

> Status: v1 (working draft). See [[catalogue-stock-tables-and-cost-storage]] for how each cost is stored, and [[alerts]] for the alert thresholds.

## What is the margin?

The money the company **keeps** after paying for everything on a project.

```
Margin = Budget − Cost of Materials − Cost of Subcontractors − Cost of Employees
```

If margin is positive → company made money.
If margin is negative → company lost money.

---

## Where does the budget come from?

When a devis is accepted → `projets.montant_estime` is set **automatically** from the devis total HT. Staff never types it manually.

If the client requests extra work mid-project → a new devis is created and accepted → budget updates to the new total. Every budget change is logged with the date and the new amount.

---

## The full formula

```
marge_ht  = budget_ht − cout_materiaux − cout_sous_traitance − cout_main_oeuvre
marge_pct = (marge_ht / budget_ht) × 100
```

| Term | Source |
|---|---|
| `budget_ht` | `projets.montant_estime` (from accepted devis) |
| `cout_materiaux` | `stock_mouvements`: qty × frozen `prix_unitaire` |
| `cout_sous_traitance` | `factures_achat.montant_ht` linked to this project |
| `cout_main_oeuvre` | `pointages`: heures × frozen `taux_horaire` |

All calculated **live** from `projet_marge_live` view while project is active. Frozen once into `projet_cloture_snapshot` when project becomes `termine`.

---

## Alert thresholds

| Level | When | Action |
|---|---|---|
| ⚠️ Warning | Real cost reaches **80%** of budget | Notification + email to admin and manager |
| 🔴 Critical | Real cost reaches **95%** of budget | Notification + email to admin and manager |

---

## Full scenario — Mr. Dubois bathroom renovation

### Setup

- **Devis accepted**: €10,000 HT → `projets.montant_estime` = €10,000 automatically
- **Subcontractor hired**: plumber, agreed €2,500 (`contrats_sous_traitance`)
- **2 employees**: Karim (€20/h), Youssef (€15/h)

---

### Materials used (`stock_mouvements`)

| Material | Qty | Frozen price | Cost |
|---|---|---|---|
| Tiles | 40 m² | €8.00 | €320 |
| Paint | 10 L | €6.00 | €60 |
| Filler | 5 kg | €4.00 | €20 |
| **Total materials** | | | **€400** |

---

### Subcontractor bill (`factures_achat`)

| Fournisseur | montant_ht |
|---|---|
| Plombier Martin (via contract) | €2,500 |

---

### Employee hours (`pointages`)

| Employee | Hours | Frozen rate | Cost |
|---|---|---|---|
| Karim | 20h | €20 | €400 |
| Youssef | 12h | €15 | €180 |
| **Total labor** | | | **€580** |

---

### Margin calculation

```
Budget               = €10,000
− Materials          =    €400
− Subcontractor      =  €2,500
− Employees          =    €580
─────────────────────────────
Margin (marge_ht)    =  €6,520
Margin %             =  65.2%  ✅ healthy
```

---

### What if the project runs over?

Client asks for extra work (new bathroom tiles in hallway). New devis: +€1,500 → accepted.

Budget updates: **€10,000 → €11,500**

Meanwhile, extra materials and 15 more hours of work are logged:

```
Extra materials      =    €200
Extra labor (15h)    =    €300  (Karim, €20/h)
─────────────────────────────
New real cost        =  €3,980  (€400+€2,500+€580+€200+€300)
New margin           =  €7,520  (€11,500 − €3,980)
New margin %         =  65.4%  ✅ still healthy
```

---

### What if the plumber bills more than agreed?

Contract was €2,500. Plumber sends a second bill for extra work: €1,800.

```
New subcontractor cost = €2,500 + €1,800 = €4,300

Real cost = €400 + €4,300 + €580 = €5,280
Margin    = €10,000 − €5,280 = €4,720
Margin %  = 47.2%  ✅ still ok
```

Now Karim works 30 more hours and Youssef works 20 more hours:

```
Extra labor = (30 × €20) + (20 × €15) = €600 + €300 = €900

Real cost = €5,280 + €900 = €6,180
Margin    = €10,000 − €6,180 = €3,820
Margin %  = 38.2%  still ok but decreasing
```

Karim works 20 more hours:

```
Extra = 20 × €20 = €400

Real cost = €6,580
Margin %  = (€10,000 − €6,580) / €10,000 = 34.2%
```

One more week of work — real cost hits €8,050:

```
Margin % = (€10,000 − €8,050) / €10,000 = 19.5%

→ Real cost = 80.5% of budget
→ ⚠️ WARNING alert fires to admin and manager
```

Real cost reaches €9,520:

```
Margin % = 4.8%

→ Real cost = 95.2% of budget
→ 🔴 CRITICAL alert fires
```

---

## What the manager sees on `/marges` page

One row per active project:

| Project | Budget | Real cost | Margin | Margin % | Status |
|---|---|---|---|---|---|
| Dubois bathroom | €10,000 | €8,050 | €1,950 | 19.5% | ⚠️ Warning |
| Materne facade | €25,000 | €8,000 | €17,000 | 68% | ✅ Healthy |
| Lecomte kitchen | €6,000 | €5,720 | €280 | 4.7% | 🔴 Critical |

---

## Related notes
- [[catalogue-stock-tables-and-cost-storage]]
- [[planning-pointages]]
- [[sous-traitance]]
- [[alerts]]
- [[business-logic-overview]]
