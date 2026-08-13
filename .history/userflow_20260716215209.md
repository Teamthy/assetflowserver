

 

onboarding shold stritly follow this 
# AssetFlow: Complete Onboarding Flow
## From First Visit to First Asset — Every Step Designed

---

## The Onboarding Philosophy

> **Onboarding is not a feature. It is the first impression of the entire product.**
>
> A Nigerian Finance Manager who signs up and feels confused in the first 5 minutes
> will close the tab and go back to Excel.
>
> A Nigerian Finance Manager who signs up and sees their assets in the system
> within the first 30 minutes will pay us money.
>
> **Every onboarding decision must serve one goal:**
> Get the customer to their first "aha moment" as fast as possible.
>
> **The aha moment for AssetFlow is:**
> *"I can see all my assets in one place and my auditor will actually trust this."*

---

## The Two Types of Users We Onboard

| Type | Who | Entry Point | Goal |
|---|---|---|---|
| **Account Creator** | CEO, CFO, Finance Manager who signs up | Registration form | Set up org, configure policy, import assets |
| **Invited Staff** | Team members invited by Admin | Email invitation link | Accept invite, set password, start working |

Both paths are completely different and must be designed separately.

---

---

# PATH 1: ACCOUNT CREATOR ONBOARDING
## The Primary Admin Journey

---

## Stage 1: Registration

**Page:** `/register`

**Design principle:** Fast, minimal, no friction.
Ask only what is absolutely necessary to create the account.
Everything else comes later.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────┐                                             │
│   │AssetFlow │   The fixed asset register built            │
│   └──────────┘   for African businesses                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   Create your account                               │  │
│   │                                                     │  │
│   │   Full name                                         │  │
│   │   [                                              ]  │  │
│   │                                                     │  │
│   │   Work email                                        │  │
│   │   [                                              ]  │  │
│   │                                                     │  │
│   │   Password                                          │  │
│   │   [                                              ]  │  │
│   │   ████████░░ Strong                                 │  │
│   │                                                     │  │
│   │   Organization name                                 │  │
│   │   [                                              ]  │  │
│   │                                                     │  │
│   │   [      Create Account — It's Free      ]          │  │
│   │                                                     │  │
│   │   Already have an account? Sign in                  │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ✓ No credit card required                                 │
│   ✓ 30-day free trial                                       │
│   ✓ Import your existing Excel register                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens on submit:**
- User account created
- Organization created with slug auto-generated from org name
- Primary Admin role assigned automatically
- Default accounting policy set: ₦50,000 threshold, 12 months useful life
- Access token and refresh token issued
- User auto-logged in
- Redirect to Welcome Screen

**Validation:**
- Email must be unique
- Password minimum 8 characters with strength indicator
- Organization name minimum 2 characters
- All fields required

**Error handling:**
- Email already registered: "An account with this email already exists. Sign in instead?"
- Org name taken: "This organization name is taken. Try [suggestion]."

---

## Stage 2: Welcome Screen (One-Time)

**Shown:** Immediately after registration. Never shown again.

**Purpose:** Orient the new user, celebrate their signup, set expectations, guide first action.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🎉 Welcome to AssetFlow, [First Name]                    │
│                                                             │
│   Your organization [Org Name] is ready.                   │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Let us help you get set up in 3 simple steps:            │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ① Configure your organization          5 min  →   │  │
│   │    Set your capitalization policy and              │  │
│   │    fiscal year.                                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ② Add your assets                      10 min →   │  │
│   │    Import your existing Excel register             │  │
│   │    or add assets manually.                         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  ③ Invite your team                      2 min →   │  │
│   │    Add your Finance Manager, Branch               │  │
│   │    Managers, and staff.                            │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   [    Start Setup — Step 1    ]                           │
│                                                             │
│   Skip for now → go to dashboard                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Clicking a step card starts that step
- "Start Setup" begins from Step 1
- "Skip for now" goes directly to dashboard with a persistent setup banner
- Progress is tracked (checkmarks appear as steps complete)

---

## Stage 3: Setup Wizard

**Shown:** After welcome screen, when user clicks "Start Setup"

**Design principle:** Progress bar at top. One focused task per step. Always show what's next.

---

### Step 1 of 4: Organization Profile

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Setup   ●────────○────────○────────○                     │
│           Step 1   Step 2   Step 3   Step 4                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Tell us about your organization                          │
│                                                             │
│   We use this to personalize your experience               │
│   and format your reports correctly.                       │
│                                                             │
│   Industry                                                 │
│   [Manufacturing              ▼]                           │
│                                                             │
│   Organization size                                        │
│   ○ 1-20 staff                                             │
│   ○ 21-100 staff                                           │
│   ○ 101-500 staff                                          │
│   ○ 500+ staff                                             │
│                                                             │
│   Number of locations                                      │
│   ○ Single location                                        │
│   ● Multiple locations (branches)                          │
│                                                             │
│   RC Number (optional)                                     │
│   [                                              ]         │
│   Used for invoice headers and audit reports               │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [Skip this step]          [Save and Continue →]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Logic:**
- If "Multiple locations" selected → multi-branch mode enabled
- If "Single location" → multi-branch mode off, branch step simplified

---

### Step 2 of 4: Accounting Policy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Setup   ✓────────●────────○────────○                     │
│           Step 1   Step 2   Step 3   Step 4                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Configure your accounting policy                         │
│                                                             │
│   These settings control how AssetFlow classifies          │
│   your assets for accounting purposes.                     │
│   You can change these at any time.                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  💡 What is a capitalization threshold?             │  │
│   │                                                     │  │
│   │  Assets above this cost are capitalized on your     │  │
│   │  balance sheet. Assets below are expensed.          │  │
│   │  The Nigerian standard is typically ₦50,000.        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Capitalization threshold                                  │
│   ₦ [50,000                                   ]            │
│                                                             │
│   Minimum useful life for capitalization                   │
│   [12] months                                              │
│                                                             │
│   Disposal approval threshold                               │
│   ₦ [500,000                                  ]            │
│   Disposals above this value require Finance approval       │
│                                                             │
│   Fiscal year end month                                     │
│   [December                   ▼]                           │
│                                                             │
│   Default depreciation method                               │
│   ○ Straight Line (recommended for most assets)            │
│   ○ Reducing Balance                                        │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [← Back]   [Skip — use defaults]   [Save and Continue →] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Logic:**
- Defaults are pre-filled (₦50,000, 12 months, ₦500,000, December, Straight Line)
- User can keep defaults and just click Continue
- Tooltip explains each field
- Changes saved immediately to org settings

---

### Step 3 of 4: Set Up Branches

**Shown only if:** User selected "Multiple locations" in Step 1

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Setup   ✓────────✓────────●────────○                     │
│           Step 1   Step 2   Step 3   Step 4                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Add your locations                                        │
│                                                             │
│   Create branches for each location where you              │
│   have assets. You can add more later.                     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Branch 1                                           │  │
│   │  Branch name *  [Lagos Head Office              ]   │  │
│   │  Branch code    [LHO                            ]   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Branch 2                                           │  │
│   │  Branch name *  [Abuja Office                   ]   │  │
│   │  Branch code    [ABJ                            ]   │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   [+ Add another branch]                                   │
│                                                             │
│   You have added 2 branches                                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [← Back]   [Skip for now]   [Save and Continue →]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**If "Single location" was selected in Step 1:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Setup   ✓────────✓────────●────────○                     │
│                                                             │
│   Your main location                                        │
│                                                             │
│   Since you operate from a single location,                │
│   we will set it up as your main branch.                   │
│                                                             │
│   Location name                                             │
│   [Head Office                                    ]         │
│                                                             │
│   [← Back]          [Save and Continue →]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 4 of 4: Add Your First Assets

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Setup   ✓────────✓────────✓────────●                     │
│           Step 1   Step 2   Step 3   Step 4                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Add your assets                                           │
│                                                             │
│   Choose how you want to bring your assets                 │
│   into AssetFlow:                                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   📊  Import from Excel             RECOMMENDED     │  │
│   │                                                     │  │
│   │   Already have an asset register in Excel?          │  │
│   │   Upload it and we will import everything           │  │
│   │   in minutes.                                       │  │
│   │                                                     │  │
│   │   [Import from Excel →]                             │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   ✏️  Add assets manually                           │  │
│   │                                                     │  │
│   │   Start fresh and add assets one by one.            │  │
│   │   Good for smaller registers.                       │  │
│   │                                                     │  │
│   │   [Add asset manually →]                            │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   ⏭️  Skip for now                                  │  │
│   │                                                     │  │
│   │   Go to your dashboard and add assets later.        │  │
│   │                                                     │  │
│   │   [Go to dashboard →]                               │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**If "Import from Excel" selected:**
→ Redirect to `/assets/import` with onboarding context banner at top

**If "Add manually" selected:**
→ Redirect to `/assets/new` with onboarding context banner

**If "Skip":**
→ Redirect to dashboard with onboarding progress banner

---

## Stage 4: Setup Complete Screen

**Shown after:** First asset is added or imported OR user explicitly skips Step 4

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🎉                                       │
│                                                             │
│         You are all set, [First Name]!                      │
│                                                             │
│   Here is what you have set up:                            │
│                                                             │
│   ✓  Organization: [Org Name]                              │
│   ✓  Accounting policy configured                          │
│   ✓  2 branches created                                    │
│   ✓  47 assets imported                                    │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   What would you like to do next?                          │
│                                                             │
│   [View your assets]                                       │
│   [Invite your team]                                       │
│   [View audit summary]                                     │
│                                                             │
│   [Go to dashboard →]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 5: Dashboard with Onboarding Progress Banner

**Shown on dashboard when setup is incomplete**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  TOPBAR                                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🚀 Complete your setup — 2 of 4 steps done           │ │
│  │                                                       │ │
│  │  ✓ Organization configured                            │ │
│  │  ✓ Accounting policy set                              │ │
│  │  ○ Add your branches                    [Do this →]  │ │
│  │  ○ Import your assets                   [Do this →]  │ │
│  │                                                       │ │
│  │  ████████░░░░░░░░  50% complete    [Dismiss]          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  DASHBOARD CONTENT BELOW                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Banner persists until all 4 steps are complete
- Each step shows checkmark when done
- Clicking "Do this →" takes user to that step
- "Dismiss" hides the banner (can be restored from dashboard settings)
- Banner disappears automatically when all steps complete

---

---

# PATH 2: INVITED STAFF ONBOARDING
## The Team Member Journey

---

## Stage 1: Invitation Email

**What the email looks like:**

```
Subject: [Admin Name] invited you to join [Org Name] on AssetFlow

─────────────────────────────────────────
                AssetFlow
─────────────────────────────────────────

Hi [Invitee Name or "there"],

[Admin Name] has invited you to join
[Organization Name] on AssetFlow as
[Role Name].

AssetFlow is the fixed asset management
platform [Org Name] uses to track and
manage their assets.

[    Accept Invitation    ]

This link expires in 7 days.

If you did not expect this invitation,
you can safely ignore this email.

─────────────────────────────────────────
© AssetFlow  |  assetflow.ng
```

---

## Stage 2: Accept Invitation Page

**URL:** `/accept-invite/:token`

**On page load:** System validates token

```
TOKEN VALIDATION
     ↓
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  VALID TOKEN → Show acceptance form                      │
│                                                          │
│  EXPIRED TOKEN → Show expiry screen                      │
│  "This invitation has expired.                           │
│   Invitations are valid for 7 days.                      │
│   Contact [Admin Name] at [Org Name]                     │
│   to request a new invitation."                          │
│                                                          │
│  ALREADY USED → Show used screen                         │
│  "This invitation has already been accepted.             │
│   Sign in to access [Org Name]."                         │
│   [Sign In]                                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Valid Token — Acceptance Form:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────┐                                             │
│   │AssetFlow │                                             │
│   └──────────┘                                             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │   You have been invited to join                     │  │
│   │                                                     │  │
│   │   ┌───────────────────────────────────────────┐    │  │
│   │   │  🏢  [Organization Name]                  │    │  │
│   │   │      Invited by [Admin Full Name]          │    │  │
│   │   │      Your role: [Role Name Badge]          │    │  │
│   │   └───────────────────────────────────────────┘    │  │
│   │                                                     │  │
│   │   Complete your account to get started:             │  │
│   │                                                     │  │
│   │   Full name                                         │  │
│   │   [                                              ]  │  │
│   │                                                     │  │
│   │   Email                                             │  │
│   │   [invited@email.com              ] (pre-filled)    │  │
│   │                                                     │  │
│   │   Create password                                   │  │
│   │   [                                              ]  │  │
│   │   ██████░░░░ Moderate                               │  │
│   │                                                     │  │
│   │   Confirm password                                  │  │
│   │   [                                              ]  │  │
│   │                                                     │  │
│   │   [    Accept Invitation and Join    ]              │  │
│   │                                                     │  │
│   │   Already have an account? Sign in instead          │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 3: Staff Welcome Screen

**Shown:** Immediately after accepting invitation. Specific to their role.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Welcome to [Org Name], [First Name]! 👋                  │
│                                                             │
│   You have joined as [Role Name]                           │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [Role-specific welcome message]                          │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [Go to my dashboard →]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Role-specific welcome messages:**

| Role | Message |
|---|---|
| Asset Manager | "You now manage the asset register for [Org Name]. Start by reviewing existing assets or importing your current register." |
| Finance User | "You have access to all financial and accounting data. Review recognition decisions and record depreciation from your dashboard." |
| Branch Manager | "You manage assets at [Branch Name]. Review your branch assets and maintenance tasks from your dashboard." |
| Maintenance Staff | "Your maintenance tasks will appear on your dashboard. Complete assigned tasks and log your work here." |
| Auditor | "You have read-only access to all asset records. Review the asset register, timelines, and audit summary from your dashboard." |
| Standard Staff | "Your assigned assets and tasks appear on your dashboard. You will be notified when something is assigned to you." |

---

## Stage 4: Role-Specific First Actions

**After welcome screen, user lands on dashboard.**
**Dashboard shows role-appropriate first action prompts.**

---

### Asset Manager First Actions

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  👋 Welcome! Here is where to start:                  │ │
│  │                                                       │ │
│  │  1. Review existing assets in the register            │ │
│  │     [View Assets →]                                   │ │
│  │                                                       │ │
│  │  2. Import your Excel asset register                  │ │
│  │     [Import Assets →]                                 │ │
│  │                                                       │ │
│  │  3. Check assets missing key data                     │ │
│  │     [View Audit Summary →]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Finance User First Actions

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  👋 Welcome! Your priority actions:                   │ │
│  │                                                       │ │
│  │  1. Review assets pending recognition decision        │ │
│  │     [X assets need review →]                          │ │
│  │                                                       │ │
│  │  2. Check depreciation records for this fiscal year   │ │
│  │     [View Finance Dashboard →]                        │ │
│  │                                                       │ │
│  │  3. Review your accounting policy settings            │ │
│  │     [View Policy →]                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Branch Manager First Actions

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  👋 Welcome! You manage [Branch Name]:                │ │
│  │                                                       │ │
│  │  1. View assets in your branch                        │ │
│  │     [View Branch Assets →]                            │ │
│  │                                                       │ │
│  │  2. Check maintenance tasks                           │ │
│  │     [View Maintenance →]                              │ │
│  │                                                       │ │
│  │  3. Add a new asset to your branch                    │ │
│  │     [Add Asset →]                                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Maintenance Staff First Actions

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  👋 Welcome! Here are your tasks:                     │ │
│  │                                                       │ │
│  │  You have [X] maintenance tasks assigned to you.      │ │
│  │                                                       │ │
│  │  [View My Tasks →]                                    │ │
│  │                                                       │ │
│  │  You will be notified when new tasks are assigned.    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

---

# PATH 3: IMPORT ONBOARDING FLOW
## The "I Have an Excel File" Journey

This is the most important onboarding flow for Nigerian customers.
Most will have an existing Excel asset register.
This flow must make that transition feel effortless.

---

## The Import Onboarding Experience

**Entry:** From setup wizard Step 4 or directly from asset list

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ← Back to setup                                           │
│                                                             │
│  Import your asset register                                 │
│                                                             │
│  Most organizations already have assets in Excel.          │
│  We make it easy to bring them in.                         │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  STEP 1: Get the template                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   📥  Download our Excel template                   │   │
│  │                                                     │   │
│  │   Our template includes all the columns             │   │
│  │   AssetFlow needs. Copy your existing data          │   │
│  │   into the template columns.                        │   │
│  │                                                     │   │
│  │   [Download Template]                               │   │
│  │                                                     │   │
│  │   Template columns include:                         │   │
│  │   • Asset Name (required)                           │   │
│  │   • Asset Tag (required, must be unique)            │   │
│  │   • Serial Number                                   │   │
│  │   • Category                                        │   │
│  │   • Purchase Cost                                   │   │
│  │   • Purchase Date                                   │   │
│  │   • Branch                                          │   │
│  │   • Assigned To (email address)                     │   │
│  │   • Condition                                       │   │
│  │   • Useful Life (months)                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   💡 Already have your own Excel format?            │   │
│  │                                                     │   │
│  │   You can upload your existing file directly.       │   │
│  │   We will try to match your columns automatically.  │   │
│  │   Or copy your data into our template for the       │   │
│  │   best results.                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [I have my file ready — Upload now →]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

```
STEP 2: Upload

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Upload your Excel file                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                                                     │   │
│  │           📂                                        │   │
│  │                                                     │   │
│  │    Drag and drop your Excel file here               │   │
│  │    or click to browse                               │   │
│  │                                                     │   │
│  │    .xlsx or .xls  •  Max 5MB  •  Max 1,000 rows    │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [← Back]                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

```
STEP 3: Preview (after upload)

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Review your import                                         │
│                                                             │
│  ┌──────────┬──────────┬────────────┐                      │
│  │ ✓ Ready  │ ✗ Errors │ Recognition│                      │
│  │    47    │    3     │  Summary   │                      │
│  └──────────┴──────────┴────────────┘                      │
│                                                             │
│  ● READY TO IMPORT TAB                                      │
│                                                             │
│  Name          Tag      Cost        Treatment               │
│  ────────────────────────────────────────────────────────  │
│  Generator A   AST-001  ₦1,200,000  Capitalized ●          │
│  Laptop Dell   AST-002  ₦350,000    Capitalized ●          │
│  Office Chair  AST-003  ₦35,000     Non-Cap ●              │
│  ... 44 more rows                                          │
│                                                             │
│  ✗ ERROR ROWS TAB                                           │
│                                                             │
│  Row 5:  Missing asset tag                                  │
│  Row 12: Invalid date format (use DD/MM/YYYY)              │
│  Row 23: Duplicate tag AST-004 (already in row 7)          │
│                                                             │
│  [Download error details]                                   │
│                                                             │
│  Recognition summary:                                       │
│  Capitalized: 31  |  Expensed: 8  |  Non-cap: 6  |  Review: 2│
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  [← Fix errors and re-upload]   [Import 47 assets →]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

```
STEP 4: Import Success

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✅                                       │
│                                                             │
│         Import complete!                                    │
│                                                             │
│   47 assets have been added to your register               │
│   3 rows were skipped due to errors                        │
│                                                             │
│   Recognition results:                                      │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Capitalized         31 assets   ₦45,200,000        │  │
│   │  Expensed             8 assets   ₦180,000           │  │
│   │  Non-capitalized      6 assets   ₦450,000           │  │
│   │  Pending review       2 assets   ₦1,200,000         │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   2 assets need your attention                             │
│   [Review pending assets →]                                │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   [View all my assets →]                                   │
│   [Download import results]                                 │
│   [Invite my team →]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

---

# PATH 4: CONTEXTUAL ONBOARDING
## Ongoing Help After Setup

---

## Contextual Tooltips (First Visit to Each Section)

When a user visits a section for the first time, show a contextual tip.
Show once only. Dismiss permanently.

---

### First visit to Asset List

```
┌─────────────────────────────────────────────────────────────┐
│  Assets                                          [Got it ×] │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💡 This is your asset register                       │ │
│  │                                                       │ │
│  │  Every physical asset your organization owns          │ │
│  │  lives here. Use the filters to find assets           │ │
│  │  by branch, status, condition, or type.               │ │
│  │                                                       │ │
│  │  [Got it]                                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### First visit to Depreciation tab

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💡 Recording depreciation                            │ │
│  │                                                       │ │
│  │  Depreciation records here are annual snapshots.      │ │
│  │  Record one per fiscal year for each capitalized      │ │
│  │  asset. Your auditors will see a full history.        │ │
│  │                                                       │ │
│  │  [Got it]                                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### First visit to Audit Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💡 Your audit readiness score                        │ │
│  │                                                       │ │
│  │  This page shows gaps in your asset data.             │ │
│  │  A higher completeness score means your register      │ │
│  │  is more audit-ready. Click any issue to see          │ │
│  │  the affected assets and fix them.                    │ │
│  │                                                       │ │
│  │  [Got it]                                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Empty State Onboarding Prompts

Every empty state is also an onboarding moment.

---

### Empty Asset List (No Assets Yet)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📦                                       │
│                                                             │
│         No assets yet                                       │
│                                                             │
│   Your asset register is empty.                            │
│   Add assets manually or import your                       │
│   existing Excel register to get started.                  │
│                                                             │
│   [Import from Excel]     [Add asset manually]             │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   💡 Tip: Most organizations start with an Excel           │
│   import. It takes less than 5 minutes.                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Empty Maintenance List

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🔧                                       │
│                                                             │
│         No maintenance tasks yet                           │
│                                                             │
│   Create maintenance tasks to track asset                  │
│   servicing, repairs, and inspections.                     │
│                                                             │
│   [Create first task]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Empty Branch List

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🏢                                       │
│                                                             │
│         No branches yet                                     │
│                                                             │
│   Create branches to organize assets by location.          │
│   Each branch can have its own assets, staff,              │
│   and maintenance tasks.                                   │
│                                                             │
│   [Create first branch]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## In-App Onboarding Checklist (Persistent Until Complete)

**Accessible from:** Dashboard banner and a dedicated checklist icon in topbar

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Getting started with AssetFlow                            │
│                                                             │
│  ████████████░░░░░░░  60% complete                         │
│                                                             │
│  ✓  Create your account                                    │
│  ✓  Configure accounting policy                            │
│  ✓  Add your first branch                                  │
│  ○  Import or add your assets              [Do this →]     │
│  ○  Invite a team member                   [Do this →]     │
│  ○  Record your first depreciation         [Do this →]     │
│  ○  Review your audit summary              [Do this →]     │
│                                                             │
│  [Dismiss checklist]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

---

# ONBOARDING FLOW SUMMARY

## The Complete Onboarding Map

```
NEW VISITOR
     ↓
Landing page → Register
     ↓
Welcome screen (one-time)
     ↓
Setup Wizard:
  Step 1: Organization profile
  Step 2: Accounting policy
  Step 3: Branches
  Step 4: Import or add assets
     ↓
Setup complete screen
     ↓
DASHBOARD with checklist banner
     ↓
Contextual tooltips as user explores
     ↓
Empty state prompts guide next actions
     ↓
Checklist tracks progress
     ↓
All items complete → Checklist disappears
     ↓
FULLY ONBOARDED

─────────────────────────────────────────────────────────

INVITED STAFF
     ↓
Invitation email
     ↓
Accept invite page (/accept-invite/:token)
     ↓
Set name and password
     ↓
Role-specific welcome screen
     ↓
Role-appropriate dashboard with first action prompts
     ↓
Contextual tooltips on first visit to each section
     ↓
FULLY ONBOARDED

─────────────────────────────────────────────────────────

RETURNING USER
     ↓
Login → Dashboard
     ↓
If setup incomplete → banner shows remaining steps
     ↓
If setup complete → clean dashboard, no interruptions
```

---

## The Onboarding Success Metrics

| Metric | Target | Why It Matters |
|---|---|---|
| Registration to first asset | Under 15 minutes | Faster = higher retention |
| Setup wizard completion rate | Above 70% | Incomplete setup = churned customer |
| Import success rate | Above 90% | Failed import = frustration |
| Invited staff acceptance rate | Above 80% | Low acceptance = org not using product |
| Day 7 retention | Above 60% | Onboarded customers stay |
| Time to first depreciation record | Under 7 days | Engagement with core value |
| Audit summary views in week 1 | Above 50% | Customers discovering core value |

---

## The One Thing That Will Make Onboarding Work

> **The import flow is everything.**
>
> Every Nigerian company we sell to has an Excel file.
> If we make importing that Excel file feel magical —
> fast, accurate, with zero data loss —
> the customer will trust us immediately.
>
> If the import is confusing, broken, or loses their data,
> they will never come back.
>
> **Invest disproportionately in making the import flow
> the smoothest experience in the entire product.**

and also enforce this flow 
# AssetFlow: Complete User Flow
## From Onboarding to Every Route

---

## How to Read This Document

> Every flow is written from the **user's perspective.**
> Every decision point is mapped.
> Every route has a clear entry, action, and exit.
> Every role sees what they should see and nothing more.

---

# PART 1: ONBOARDING FLOWS

---

## Flow 1.1: Organization Registration (New Customer)

**Who:** Anyone signing up for the first time
**Entry point:** assetflow.ng → "Get Started" or "Create Account"

```
LANDING PAGE
     ↓
Click "Start Free Trial" or "Create Account"
     ↓
REGISTRATION PAGE (/register)
     ↓
┌─────────────────────────────────┐
│  Step 1: Your Details           │
│  - Full name                    │
│  - Work email                   │
│  - Password                     │
│  - Confirm password             │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Step 2: Your Organization      │
│  - Organization name            │
│  - Industry (optional)          │
│  - Organization size (optional) │
└─────────────────────────────────┘
     ↓
Click "Create Account"
     ↓
System creates:
  - User account
  - Organization
  - Primary Admin role assigned
  - Default accounting policy set (₦50,000 threshold)
  - Access token and refresh token issued
     ↓
AUTO-LOGIN
     ↓
WELCOME SCREEN (one-time)
┌─────────────────────────────────────────────────┐
│  Welcome to AssetFlow, [Name]                   │
│  Your organization [Org Name] is ready.         │
│                                                 │
│  Let us help you get started:                   │
│                                                 │
│  ○ Step 1: Set up your first branch             │
│  ○ Step 2: Import your existing assets          │
│  ○ Step 3: Invite your team                     │
│                                                 │
│  [Set Up Branch]  [Import Assets]  [Skip Tour]  │
└─────────────────────────────────────────────────┘
     ↓
DASHBOARD (/dashboard)
```

---

## Flow 1.2: First-Time Setup Wizard

**Who:** Primary Admin after registration
**Triggered by:** Clicking "Set Up Branch" on welcome screen

```
SETUP WIZARD (overlay or dedicated screen)
     ↓
┌─────────────────────────────────┐
│  Step 1 of 3: Add Your Branch   │
│                                 │
│  Do you operate from multiple   │
│  locations?                     │
│                                 │
│  [Yes, multiple branches]       │
│  [No, single location]          │
└─────────────────────────────────┘
     ↓
If "Yes" → Enable multi-branch mode → Create first branch
If "No"  → Skip branch creation → Proceed to step 2
     ↓
┌─────────────────────────────────┐
│  Step 2 of 3: Configure Policy  │
│                                 │
│  Capitalization threshold:      │
│  [₦50,000] (editable)           │
│                                 │
│  Fiscal year end:               │
│  [December] (selectable)        │
│                                 │
│  Depreciation method:           │
│  [Straight Line] (selectable)   │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Step 3 of 3: Import or Add     │
│                                 │
│  How do you want to start?      │
│                                 │
│  [Import from Excel]            │
│  [Add assets manually]          │
│  [Skip for now]                 │
└─────────────────────────────────┘
     ↓
Setup complete → DASHBOARD
```

---

## Flow 1.3: Staff Invitation and Acceptance

**Who:** Admin invites staff. Staff accepts.

### Admin Side

```
SETTINGS → TEAM (/settings/team)
     ↓
Click "Invite Member"
     ↓
INVITE MODAL
┌─────────────────────────────────┐
│  Invite Team Member             │
│                                 │
│  Email address: [input]         │
│  Role: [dropdown selector]      │
│         - Organization Admin    │
│         - Asset Manager         │
│         - Finance User          │
│         - Branch Manager        │
│         - Maintenance Staff     │
│         - Auditor               │
│         - Standard Staff        │
│                                 │
│  [Cancel]  [Send Invitation]    │
└─────────────────────────────────┘
     ↓
System creates invitation record
System sends email with unique token link
     ↓
Toast: "Invitation sent to [email]"
     ↓
Pending invitations list updated
```

### Staff Side (Invitation Acceptance)

```
Staff receives email
     ↓
Clicks invitation link
     ↓
ACCEPT INVITATION PAGE (/accept-invite/:token)
     ↓
System validates token:
     ↓
┌──────────────────────────────────────────────┐
│  Token valid?                                │
│                                              │
│  YES → Show acceptance form                  │
│  NO  → "This invitation has expired.         │
│         Contact your administrator."         │
└──────────────────────────────────────────────┘
     ↓ (if valid)
ACCEPTANCE FORM
┌─────────────────────────────────────────────┐
│  You have been invited to join              │
│  [Organization Name] on AssetFlow           │
│  as [Role Name]                             │
│                                             │
│  Invited by: [Admin Name]                   │
│                                             │
│  Complete your account:                     │
│  Full name: [input]                         │
│  Password: [input]                          │
│  Confirm password: [input]                  │
│                                             │
│  [Create Account and Join]                  │
└─────────────────────────────────────────────┘
     ↓
Account created and activated
Auto-login
     ↓
DASHBOARD (role-appropriate view)
     ↓
Toast: "Welcome to [Org Name]. You are logged in as [Role]."
```

---

## Flow 1.4: Returning User Login

```
LOGIN PAGE (/login)
     ↓
Enter email and password
     ↓
┌──────────────────────────────────────────────┐
│  Single organization membership?             │
│                                              │
│  YES → Auto-login → DASHBOARD               │
│  NO  → ORGANIZATION SELECTOR               │
└──────────────────────────────────────────────┘
     ↓ (multiple orgs)
ORGANIZATION SELECTOR
┌─────────────────────────────────────────────┐
│  Select Organization                        │
│                                             │
│  ○ Dangote Foods Ltd (Admin)                │
│  ○ Atlas Manufacturing (Asset Manager)      │
│                                             │
│  [Continue]                                 │
└─────────────────────────────────────────────┘
     ↓
DASHBOARD (scoped to selected org)
```

---

## Flow 1.5: Organization Login (Slug Login)

**For users who know their organization code**

```
LOGIN PAGE
     ↓
Click "Sign in with organization code"
     ↓
ORG LOGIN PAGE (/org-login)
     ↓
┌─────────────────────────────────────────────┐
│  Organization code: [input] e.g. dangote-foods │
│  Email: [input]                             │
│  Password: [input]                          │
│                                             │
│  [Sign In]                                  │
└─────────────────────────────────────────────┘
     ↓
DASHBOARD (directly scoped to that org)
```

---

## Flow 1.6: Password Reset

```
LOGIN PAGE
     ↓
Click "Forgot password"
     ↓
FORGOT PASSWORD (/forgot-password)
     ↓
┌─────────────────────────────────────────────┐
│  Step 1: Enter your email                   │
│  [email input]                              │
│  [Send Reset Code]                          │
└─────────────────────────────────────────────┘
     ↓
System sends OTP (does not reveal if email exists)
     ↓
Toast: "If this email is registered, a reset code has been sent."
     ↓
┌─────────────────────────────────────────────┐
│  Step 2: Enter OTP                          │
│  [6-digit OTP input]                        │
│  Expires in: [14:32] countdown              │
│  [Resend code] (after 60 seconds)           │
│  [Verify Code]                              │
└─────────────────────────────────────────────┘
     ↓
OTP valid?
     ↓
┌─────────────────────────────────────────────┐
│  Step 3: Set new password                   │
│  New password: [input]                      │
│  Confirm password: [input]                  │
│  [Reset Password]                           │
└─────────────────────────────────────────────┘
     ↓
Password updated
All refresh tokens revoked
     ↓
Redirect to LOGIN
Toast: "Password reset successful. Please sign in."
```

---

---

# PART 2: DASHBOARD FLOWS

---

## Flow 2.1: Dashboard Entry (All Roles)

```
SUCCESSFUL LOGIN
     ↓
DASHBOARD (/dashboard)
     ↓
System determines role
     ↓
┌────────────────────────────────────────────────────────┐
│  Role-based dashboard rendered:                        │
│                                                        │
│  Primary Admin / Org Admin  → Full org overview        │
│  Asset Manager              → Asset operations view    │
│  Finance User               → Finance and accounting   │
│  Branch Manager             → Own branch view          │
│  Maintenance Staff          → My tasks view            │
│  Auditor                    → Audit overview           │
│  Standard Staff             → My assets and tasks      │
└────────────────────────────────────────────────────────┘
     ↓
Dashboard loads with:
  - Summary metric cards
  - Charts and graphs
  - Activity feeds
  - Quick action buttons
```

---

## Flow 2.2: Dashboard Quick Actions

**From dashboard, user can jump directly to:**

```
DASHBOARD
     ↓
Quick action buttons (role-dependent):
     │
     ├── [Add Asset] → /assets/new
     ├── [Import Assets] → /assets/import
     ├── [Create Maintenance Task] → /maintenance/new
     ├── [View Pending Approvals] → /reports (approvals tab)
     ├── [Export Audit Pack] → triggers download
     ├── [View Overdue Tasks] → /maintenance?status=overdue
     └── [View Missing Data] → /reports/audit
```

---

---

# PART 3: ASSET FLOWS

---

## Flow 3.1: Browse and Find an Asset

```
SIDEBAR → Assets
     ↓
ASSET LIST (/assets)
     ↓
Default view: All active assets, sorted by created date desc
     ↓
USER ACTIONS:
     │
     ├── SEARCH
     │   Type in search bar → Results filter in real time
     │   Searches: name, asset tag, serial number, model
     │
     ├── FILTER
     │   Click filter bar options:
     │   - Status: Active / Maintenance / Disposed
     │   - Condition: Excellent / Good / Fair / Poor
     │   - Branch: [select branch]
     │   - Assignee: [select user]
     │   - Treatment: Capitalized / Expensed / etc.
     │   - Date range: Purchase date from/to
     │   - Include deleted: toggle
     │
     ├── SORT
     │   Click column header to sort
     │   Click again to reverse
     │
     ├── PAGINATE
     │   Navigate pages
     │   Change rows per page: 10 / 25 / 50 / 100
     │
     └── SELECT ROW → View asset detail
```

---

## Flow 3.2: Create New Asset

**Accessible to:** Primary Admin, Org Admin, Asset Manager, Branch Manager (own branch)

```
ASSET LIST
     ↓
Click "Add Asset" button
     ↓
CREATE ASSET FORM (/assets/new)
     ↓
SECTION 1: Basic Information
┌─────────────────────────────────────────────┐
│  Asset Name *                               │
│  Description                                │
│  Category                                   │
│  Manufacturer                               │
│  Model                                      │
│  Asset Tag *                                │
│  Serial Number                              │
└─────────────────────────────────────────────┘
     ↓
SECTION 2: Location and Assignment
┌─────────────────────────────────────────────┐
│  Branch * (if multi-branch on)              │
│    → Branch Manager: field locked to        │
│      their branch                           │
│    → Others: full branch dropdown           │
│  Assigned To (optional)                     │
│  Status * [Active / Maintenance]            │
│  Condition * [Excellent/Good/Fair/Poor]     │
└─────────────────────────────────────────────┘
     ↓
SECTION 3: Financial Information
┌─────────────────────────────────────────────┐
│  Purchase Cost                              │
│  Purchase Date                              │
│  Warranty Expiry Date                       │
│  Expected Useful Life (months)              │
│  Residual Value                             │
└─────────────────────────────────────────────┘
     ↓
LIVE RECOGNITION PREVIEW
┌─────────────────────────────────────────────┐
│  Recognition Result:                        │
│  ● Capitalized                              │
│  This asset meets the capitalization        │
│  threshold of ₦50,000 and minimum           │
│  useful life of 12 months.                  │
└─────────────────────────────────────────────┘
     ↓
SECTION 4: Additional
┌─────────────────────────────────────────────┐
│  Future Economic Benefit [Yes/No]           │
│  Reliable Cost Measurement [Yes/No]         │
│  QR Code URL (optional)                     │
└─────────────────────────────────────────────┘
     ↓
Click "Create Asset"
     ↓
VALIDATION
┌──────────────────────────────────────────────┐
│  Errors?                                     │
│                                              │
│  YES → Highlight fields, show error messages │
│  NO  → Submit to API                        │
└──────────────────────────────────────────────┘
     ↓ (success)
Lifecycle event created
Recognition decision stored
Notifications sent if assigned
     ↓
Redirect to ASSET DETAIL (/assets/:id)
Toast: "Asset created successfully"
```

---

## Flow 3.3: View Asset Detail

```
ASSET LIST → Click asset row
     ↓
ASSET DETAIL (/assets/:id)
     ↓
PAGE HEADER
┌─────────────────────────────────────────────────────────┐
│  [Asset Name]          [Active ●] [Good ◆]              │
│  Tag: AST-00142        Treatment: Capitalized           │
│                                                         │
│  [Edit] [Transfer] [Dispose] [More ▼]                   │
│          ↑ shown based on role permissions              │
└─────────────────────────────────────────────────────────┘
     ↓
TABS:
     │
     ├── Overview Tab (default)
     │   - Core asset information
     │   - Location and assignment
     │   - Warranty status
     │
     ├── Financial Tab
     │   Visible to: Admin, Asset Manager, Finance User, Auditor
     │   - Purchase cost, residual value, useful life
     │   - Recognition status and reasons
     │   - Accounting treatment
     │   - Depreciable flag
     │
     ├── Timeline Tab
     │   - Chronological event list
     │   - Filter by event type
     │   - Paginated
     │
     ├── Maintenance Tab
     │   - All maintenance tasks for this asset
     │   - Create new task button
     │   - Filter by status
     │
     ├── Depreciation Tab
     │   Visible to: Admin, Asset Manager, Finance User, Auditor
     │   - All depreciation snapshots
     │   - Record depreciation button
     │   - Net book value summary
     │
     └── Documents Tab (Phase 2)
         - Uploaded files
         - Upload button
```

---

## Flow 3.4: Edit Asset

```
ASSET DETAIL
     ↓
Click "Edit" button
     ↓
EDIT ASSET FORM (/assets/:id/edit)
     ↓
Same form as Create Asset, pre-populated
     ↓
Role-based field access:
┌──────────────────────────────────────────────────────────┐
│  Branch Manager:                                         │
│  - Can edit core fields in own branch only              │
│  - Financial fields are locked (read only)              │
│                                                         │
│  Finance User:                                          │
│  - Can edit financial fields only                       │
│  - Core fields are locked                               │
│                                                         │
│  Asset Manager and above:                               │
│  - Can edit all fields                                  │
└──────────────────────────────────────────────────────────┘
     ↓
If recognition-driving fields changed:
  → Live recognition preview updates
  → Warning: "Recognition decision will be re-evaluated"
     ↓
Click "Save Changes"
     ↓
Validation → API call → Lifecycle event created
     ↓
Redirect back to ASSET DETAIL
Toast: "Asset updated successfully"
```

---

## Flow 3.5: Transfer Asset

**Accessible to:** Admin, Asset Manager, Branch Manager (from own branch)

```
ASSET DETAIL
     ↓
Click "Transfer" button
     ↓
TRANSFER MODAL
┌─────────────────────────────────────────────┐
│  Transfer Asset                             │
│  [Asset Name] — Tag: AST-00142              │
│                                             │
│  Current branch: Lagos Head Office          │
│  Current assignee: Chidi Okeke              │
│                                             │
│  New Branch: [dropdown — all branches]      │
│  New Assignee: [dropdown — active members]  │
│  Reason: * [textarea min 10 chars]          │
│                                             │
│  Must change at least one of branch         │
│  or assignee                                │
│                                             │
│  [Cancel]  [Transfer Asset]                 │
└─────────────────────────────────────────────┘
     ↓
Validation:
  - At least branch or assignee must change
  - New value must differ from current
     ↓
Submit → API call
     ↓
Transfer record created
Lifecycle event created
New assignee notified
Timeline updated
     ↓
Modal closes
Toast: "Asset transferred successfully"
Asset detail refreshes
```

---

## Flow 3.6: Dispose Asset

**Accessible to:** Admin, Asset Manager (initiates), Finance User (approves above threshold)

### Asset Manager Initiates

```
ASSET DETAIL
     ↓
Click "Dispose" button (or More → Dispose)
     ↓
DISPOSE MODAL
┌─────────────────────────────────────────────┐
│  Dispose Asset                              │
│  [Asset Name]                               │
│                                             │
│  ⚠ This action removes the asset from      │
│  the active register permanently.           │
│                                             │
│  Disposal Method * [dropdown]               │
│    Sold / Donated / Scrapped /              │
│    Lost / Written Off / Other               │
│                                             │
│  Reason * [textarea]                        │
│  Disposal Date * [date picker]              │
│  Proceeds * [₦ input, can be zero]          │
│  Approver Name [text, optional]             │
│  Notes [textarea, optional]                 │
│                                             │
│  [Cancel]  [Submit Disposal]                │
└─────────────────────────────────────────────┘
     ↓
Submit → System checks asset value vs threshold
     ↓
┌─────────────────────────────────────────────────────────┐
│  Asset value vs disposal threshold (default ₦500,000):  │
│                                                         │
│  BELOW threshold                                        │
│  → Disposal auto-approved                               │
│  → Asset status → Disposed immediately                  │
│  → Assignment cleared                                   │
│  → Notifications sent (Admin, assigned user)            │
│  → Redirect to asset detail                             │
│  → Toast: "Asset disposed successfully"                 │
│                                                         │
│  ABOVE threshold                                        │
│  → Disposal request created (pending_approval)          │
│  → Asset status unchanged (still Active/Maintenance)    │
│  → Finance User and Admin notified                      │
│  → Banner shown on asset: "Disposal pending approval"   │
│  → Toast: "Disposal submitted for Finance approval"     │
└─────────────────────────────────────────────────────────┘
```

### Finance User Approves

```
NOTIFICATION CENTER
     ↓
New notification: "Disposal approval required: [Asset Name]"
     ↓
Click notification → ASSET DETAIL
     ↓
DISPOSAL PENDING BANNER
┌─────────────────────────────────────────────┐
│  ⚠ Disposal Pending Approval               │
│  Requested by: [Asset Manager Name]         │
│  Method: Sold   Proceeds: ₦2,500,000        │
│  Reason: [reason text]                      │
│                                             │
│  [View Full Details]                        │
│  [Approve Disposal]  [Reject]               │
└─────────────────────────────────────────────┘
     ↓
APPROVE PATH:
Click "Approve Disposal"
     ↓
Confirmation dialog: "Are you sure you want to approve
this disposal? This cannot be undone."
     ↓
Confirm → Asset status → Disposed
         Assignment cleared
         Disposal record finalized
         Asset Manager notified (approved)
         Assigned user notified
         Org Admin notified
     ↓
Toast: "Disposal approved"

REJECT PATH:
Click "Reject"
     ↓
REJECTION MODAL
┌─────────────────────────────────────────────┐
│  Reject Disposal Request                    │
│                                             │
│  Reason for rejection: * [textarea]         │
│                                             │
│  [Cancel]  [Reject Disposal]                │
└─────────────────────────────────────────────┘
     ↓
Disposal request cancelled
Asset remains unchanged
Asset Manager notified with rejection reason
Toast: "Disposal request rejected"
```

---

## Flow 3.7: Restore Asset

**Accessible to:** Admin, Asset Manager

```
ASSET DETAIL (disposed or deleted asset)
     ↓
Click "Restore" (from More dropdown or visible button)
     ↓
RESTORE MODAL
┌─────────────────────────────────────────────┐
│  Restore Asset                              │
│  [Asset Name]                               │
│                                             │
│  Target Status * [dropdown]                 │
│    Active / Maintenance                     │
│                                             │
│  Reason * [textarea, min 10 chars]          │
│                                             │
│  [Cancel]  [Restore Asset]                  │
└─────────────────────────────────────────────┘
     ↓
Submit → Asset restored to target status
Lifecycle event created
Admin notified
     ↓
Toast: "Asset restored successfully"
Asset detail refreshes
```

---

## Flow 3.8: Record Depreciation

**Accessible to:** Admin, Asset Manager, Finance User

```
ASSET DETAIL → Depreciation Tab
     ↓
System checks pre-conditions:
┌──────────────────────────────────────────────────────────┐
│  Is asset capitalized AND depreciable?                   │
│                                                          │
│  NO  → Show message: "Depreciation can only be recorded  │
│         for capitalized, depreciable assets.             │
│         This asset is [treatment]."                      │
│        Button disabled.                                  │
│                                                          │
│  YES → Show "Record Depreciation" button                 │
└──────────────────────────────────────────────────────────┘
     ↓ (if eligible)
Click "Record Depreciation"
     ↓
DEPRECIATION MODAL
┌─────────────────────────────────────────────┐
│  Record Depreciation                        │
│  [Asset Name] — Purchase Cost: ₦5,000,000   │
│                                             │
│  Fiscal Year * [number input, e.g. 2024]    │
│  Method * [Straight Line / Reducing Balance]│
│  Period used prior years (months) *         │
│  Period used current year (months) *        │
│  Accumulated depreciation BF (₦) *          │
│  Yearly depreciation charge (₦) *           │
│                                             │
│  Total accumulated: [auto-calculated]       │
│  Net book value: [auto-calculated]          │
│                                             │
│  ⚠ Warning if NBV goes negative             │
│                                             │
│  [Cancel]  [Record Depreciation]            │
└─────────────────────────────────────────────┘
     ↓
Submit → API validates
  - Non-capitalized asset → rejected with message
  - Total accumulated ≠ BF + charge → rejected
  - Valid → snapshot created or updated
     ↓
Lifecycle event created
Admin notified
     ↓
Toast: "Depreciation recorded for FY2024"
Depreciation tab refreshes
```

---

## Flow 3.9: Import Assets

**Accessible to:** Admin, Asset Manager

```
ASSET LIST
     ↓
Click "Import Assets"
     ↓
IMPORT PAGE (/assets/import)
     ↓
STEP 1: Download Template
┌─────────────────────────────────────────────┐
│  Before you upload, download our template   │
│                                             │
│  [Download Excel Template]                  │
│                                             │
│  Template includes:                         │
│  ✓ All required and optional columns        │
│  ✓ Example data row                         │
│  ✓ Column descriptions                      │
└─────────────────────────────────────────────┘
     ↓
STEP 2: Upload File
┌─────────────────────────────────────────────┐
│  Upload your completed template             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Drag and drop your Excel file     │   │
│  │   or click to browse               │   │
│  │   .xlsx or .xls only, max 5MB      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
     ↓
File uploaded → Instant format validation
     ↓
┌──────────────────────────────────────────────┐
│  Invalid format or oversized?                │
│  YES → Error message, prompt re-upload       │
│  NO  → Proceed to preview                   │
└──────────────────────────────────────────────┘
     ↓
STEP 3: Preview Results
┌─────────────────────────────────────────────┐
│  Import Preview                             │
│                                             │
│  ✓ 47 rows ready to import                  │
│  ✗ 3 rows have errors                       │
│                                             │
│  VALID ROWS TAB | ERROR ROWS TAB            │
│                                             │
│  Valid rows table:                          │
│  Name | Tag | Cost | Recognition | Branch   │
│  ─────────────────────────────────────────  │
│  Generator... | AST-001 | ₦850,000 | Cap.  │
│  Laptop...    | AST-002 | ₦250,000 | Cap.  │
│                                             │
│  Error rows tab:                            │
│  Row 5: Missing asset tag                   │
│  Row 12: Invalid purchase date format       │
│  Row 23: Duplicate asset tag AST-004        │
│                                             │
│  [Download Error Report]                    │
└─────────────────────────────────────────────┘
     ↓
STEP 4: Confirm Import
┌─────────────────────────────────────────────┐
│  Confirm Import                             │
│                                             │
│  You are about to import 47 assets.         │
│  3 rows will be skipped due to errors.      │
│                                             │
│  Recognition summary:                       │
│  Capitalized: 31                            │
│  Expensed: 8                                │
│  Non-capitalized: 6                         │
│  Pending review: 2                          │
│                                             │
│  [Cancel]  [Import 47 Assets]               │
└─────────────────────────────────────────────┘
     ↓
Import executes
     ↓
RESULTS SCREEN
┌─────────────────────────────────────────────┐
│  Import Complete ✓                          │
│                                             │
│  ✓ 47 assets imported successfully          │
│  ✗ 3 rows failed                            │
│                                             │
│  [View Imported Assets]                     │
│  [Download Results Report]                  │
│  [Import Another File]                      │
└─────────────────────────────────────────────┘
     ↓
In-app notification sent to actor
```

---

## Flow 3.10: Export Assets

```
ASSET LIST
     ↓
Apply any filters (optional)
     ↓
Click "Export" button
     ↓
EXPORT OPTIONS DROPDOWN
┌─────────────────────────────────────────────┐
│  Export Options                             │
│                                             │
│  ○ Asset Register (current filters)         │
│  ○ Full Asset Register (all assets)         │
│  ○ Audit Pack (all sheets)                  │
│  ○ Depreciation Schedule                    │
│  ○ Disposal Report                          │
└─────────────────────────────────────────────┘
     ↓
Select option → API call with current filters
     ↓
Excel file downloads automatically
Toast: "Export complete. File downloaded."
```

---

---

# PART 4: BRANCH FLOWS

---

## Flow 4.1: Create Branch

**Accessible to:** Admin, Asset Manager

```
SIDEBAR → Branches
     ↓
BRANCH LIST (/branches)
     ↓
Click "Add Branch"
     ↓
CREATE BRANCH FORM
┌─────────────────────────────────────────────┐
│  Branch Name * [input, unique in org]       │
│  Branch Code [input, optional, unique]      │
│  Description [textarea, optional]           │
│                                             │
│  [Cancel]  [Create Branch]                  │
└─────────────────────────────────────────────┘
     ↓
Submit → Validation
  - Name must be unique among active branches
  - Code must be unique if provided
     ↓
Branch created
Admin notified
     ↓
Redirect to BRANCH DETAIL (/branches/:id)
Toast: "Branch created successfully"
```

---

## Flow 4.2: View Branch Detail

```
BRANCH LIST → Click branch row
     ↓
BRANCH DETAIL (/branches/:id)
     ↓
HEADER:
┌─────────────────────────────────────────────┐
│  Lagos Head Office   Code: LHO              │
│  [Active ●]                                 │
│                                             │
│  [Edit Branch]  [Delete Branch]             │
└─────────────────────────────────────────────┘
     ↓
SUMMARY CARDS:
  - Total assets in branch
  - Assets in maintenance
  - Total asset value
  - Open maintenance tasks
     ↓
ASSET TABLE (scoped to this branch)
  - Same filters as main asset list
  - Export branch assets button
```

---

## Flow 4.3: Delete Branch

```
BRANCH DETAIL or BRANCH LIST
     ↓
Click "Delete Branch"
     ↓
System checks: active assets in branch?
     ↓
┌────────────────────────────────────────────────────────┐
│  HAS active assets?                                    │
│                                                        │
│  YES (standard user):                                  │
│  "This branch has 23 active assets.                    │
│   Transfer or reassign all assets before deleting."    │
│   [Close]                                              │
│                                                        │
│  YES (Admin only):                                     │
│  "This branch has 23 active assets.                    │
│   You can force delete this branch.                    │
│   Assets will become unassigned."                      │
│   [Cancel]  [Force Delete]                             │
│                                                        │
│  NO assets:                                            │
│  "Are you sure you want to delete [Branch Name]?       │
│   This action can be undone by restoring the branch."  │
│   [Cancel]  [Delete Branch]                            │
└────────────────────────────────────────────────────────┘
     ↓
Confirm → Branch soft deleted
Redirect to BRANCH LIST
Toast: "Branch deleted"
```

---

---

# PART 5: MAINTENANCE FLOWS

---

## Flow 5.1: Create Maintenance Task

**Accessible to:** Admin, Asset Manager, Branch Manager (own branch), Maintenance Staff (assigned assets)

```
SIDEBAR → Maintenance
     ↓
MAINTENANCE LIST (/maintenance)
     ↓
Click "Create Task"
     ↓
CREATE TASK FORM (/maintenance/new or modal)
┌─────────────────────────────────────────────┐
│  Asset * [search and select]                │
│    → Maintenance Staff: only assigned assets│
│    → Branch Manager: only branch assets     │
│    → Others: all org assets                 │
│                                             │
│  Title * [input]                            │
│  Description [textarea]                     │
│  Priority * [Low/Medium/High/Critical]      │
│  Due Date [date picker]                     │
│  Assignee [select active member]            │
└─────────────────────────────────────────────┘
     ↓
Submit → Task created
Lifecycle event on asset created
Assignee notified
     ↓
Redirect to TASK DETAIL (/maintenance/:id)
Toast: "Maintenance task created"
```

---

## Flow 5.2: Manage Maintenance Task Status

```
TASK DETAIL (/maintenance/:id)
     ↓
Current status determines available actions:
     │
     ├── OPEN
     │   Available: [Start Task] [Cancel Task] [Edit]
     │   Start Task → status: in_progress
     │              → Asset status: maintenance
     │              → startedAt recorded
     │
     ├── IN_PROGRESS
     │   Available: [Complete Task] [Cancel Task]
     │   Complete Task → COMPLETION MODAL
     │   ┌──────────────────────────────────────┐
     │   │ Completion Note * [textarea]          │
     │   │ Completion Date * [date, default today]│
     │   │ [Cancel] [Mark Complete]              │
     │   └──────────────────────────────────────┘
     │   → status: completed
     │   → completedAt recorded
     │   → completedBy recorded
     │   → Check: any other in_progress tasks on asset?
     │     NO  → Asset status back to active
     │     YES → Asset remains in maintenance
     │   → Lifecycle event created
     │
     ├── COMPLETED
     │   Available: [View only]
     │   Cannot reopen
     │   Cannot cancel
     │
     └── CANCELLED
         Available: [View only]
         Cannot reopen
```

---

## Flow 5.3: Maintenance List Filters

```
MAINTENANCE LIST (/maintenance)
     ↓
Default view varies by role:
  - Admin / Asset Manager: All tasks, all branches
  - Branch Manager: Own branch tasks only
  - Maintenance Staff: Own assigned tasks only
  - Standard Staff: Own assigned tasks only
     ↓
FILTER OPTIONS:
  - Search: task title, asset name
  - Status: Open / In Progress / Completed / Cancelled
  - Priority: Low / Medium / High / Critical
  - Assignee: select member
  - Asset: search asset
  - Branch: select branch (Admin/Asset Manager only)
  - Due date range
  - Overdue only toggle
     ↓
TABLE COLUMNS:
  Title | Asset | Branch | Status | Priority | Assignee | Due Date | Actions
     ↓
ROW ACTIONS:
  - View detail
  - Edit (if open or in progress)
  - Complete (if in progress)
  - Cancel (if open)
```

---

---

# PART 6: NOTIFICATION FLOWS

---

## Flow 6.1: Receive and Read Notifications

```
ANY PAGE (authenticated)
     ↓
Topbar notification bell badge shows unread count
     ↓
USER ACTIONS:
     │
     ├── CLICK BELL ICON
     │   → Notification drawer opens from right
     │   → Shows last 20 notifications
     │   → Unread shown in bold with blue dot
     │   → "Mark all read" button at top
     │   → Each item:
     │       - Click → marks as read
     │               → navigates to relevant record
     │
     └── GO TO NOTIFICATION CENTER (/notifications)
         → Full list with filters
         → Type filter: All / Unread / By type
         → Mark individual as read
         → Mark all as read
         → Click notification → navigate to record
```

---

## Flow 6.2: Notification Triggers (What Creates Notifications)

```
EVENT → WHO GETS NOTIFIED
     │
     ├── Asset assigned to user
     │   → Assigned user: "Asset [Name] has been assigned to you"
     │
     ├── Asset transferred to user
     │   → New assignee: "Asset [Name] has been transferred to you"
     │   → Old assignee: "Asset [Name] has been transferred away"
     │
     ├── Asset disposed (auto-approved)
     │   → Org Admins: "Asset [Name] has been disposed"
     │   → Previous assignee: "Asset [Name] assigned to you has been disposed"
     │
     ├── Disposal submitted for approval (above threshold)
     │   → Finance Users and Admins: "Disposal approval needed: [Asset Name]"
     │
     ├── Disposal approved
     │   → Asset Manager who initiated: "Your disposal of [Asset Name] was approved"
     │
     ├── Disposal rejected
     │   → Asset Manager who initiated: "Your disposal of [Asset Name] was rejected: [reason]"
     │
     ├── Maintenance task assigned
     │   → Assigned staff: "You have been assigned maintenance task: [Title]"
     │
     ├── Maintenance task due soon (48 hours)
     │   → Assignee: "Maintenance task [Title] is due in 48 hours"
     │   → Branch Manager: same
     │
     ├── Maintenance task overdue (24 hours past due)
     │   → Assignee: "Maintenance task [Title] is overdue"
     │   → Branch Manager: same
     │   → Org Admin: same
     │
     ├── Depreciation recorded
     │   → Org Admins: "Depreciation recorded for [Asset Name] FY[year]"
     │
     ├── Warranty expiring (30 days)
     │   → Asset Manager: "Warranty for [Asset Name] expires in 30 days"
     │
     ├── Warranty expiring (7 days)
     │   → Asset Manager and Admin: "Warranty for [Asset Name] expires in 7 days"
     │
     ├── Asset import completed
     │   → Actor: "Import complete: [X] assets imported, [Y] failed"
     │
     ├── Branch created or updated
     │   → Org Admins: "[Branch Name] has been created/updated"
     │
     ├── Branch Manager creates asset
     │   → Asset Managers: "[Branch Manager Name] added a new asset: [Asset Name]"
     │
     └── Asset restored
         → Org Admins: "Asset [Name] has been restored by [User]"
```

---

---

# PART 7: REPORTS AND AUDIT FLOWS

---

## Flow 7.1: Access Reports

```
SIDEBAR → Reports
     ↓
REPORTS HUB (/reports)
     ↓
Available reports shown based on role:
┌──────────────────────────────────────────────────────────┐
│  Card grid of available reports:                         │
│                                                          │
│  [Asset Register]     → All roles except Staff           │
│  [Finance Dashboard]  → Admin, Finance User, Auditor     │
│  [Maintenance Report] → Admin, Asset Mgr, Branch Mgr     │
│  [Audit Dashboard]    → Admin, Asset Mgr, Finance, Audit │
└──────────────────────────────────────────────────────────┘
     ↓
Click report card → Navigate to report
```

---

## Flow 7.2: Audit Summary Flow

```
REPORTS → Audit Dashboard (/reports/audit)
     ↓
SUMMARY CARDS:
  - Data completeness score (%)
  - Missing serial numbers (count)
  - Missing purchase dates (count)
  - Missing categories (count)
  - Pending recognition review (count)
  - Capitalized assets with no depreciation this FY (count)
     ↓
DATA QUALITY TABLE:
┌─────────────────────────────────────────────────────────┐
│  Issue                  │ Count │ % │ Action            │
│  ─────────────────────────────────────────────────────  │
│  Missing serial number  │  24   │12%│ [View Assets]     │
│  Missing purchase date  │  11   │6% │ [View Assets]     │
│  Missing category       │   8   │4% │ [View Assets]     │
│  Pending review         │   5   │3% │ [Review Now]      │
│  No depreciation FY2024 │  31   │16%│ [View Assets]     │
└─────────────────────────────────────────────────────────┘
     ↓
Click "View Assets" → Asset list filtered to that issue
Click "Review Now" → Asset list filtered to pending review
     ↓
EXPORT OPTIONS:
  [Download Audit Pack]  → Multi-sheet Excel
  [Missing Data Report]  → Filtered Excel
```

---

---

# PART 8: SETTINGS FLOWS

---

## Flow 8.1: Organization Settings

**Accessible to:** Primary Admin, Org Admin

```
SIDEBAR → Settings
     ↓
SETTINGS HUB (/settings)
     ↓
SETTINGS SIDEBAR NAVIGATION:
  - Organization Profile
  - Accounting Policy
  - Team Management
  - Billing and Plan
  - Notification Preferences
     ↓
ORGANIZATION PROFILE (/settings/organization)
┌─────────────────────────────────────────────┐
│  Organization Name * [input]                │
│  Organization Slug * [input]                │
│  Industry [select]                          │
│  Address [textarea]                         │
│  RC Number [input]                          │
│  Logo [upload]                              │
│                                             │
│  [Save Changes]                             │
└─────────────────────────────────────────────┘
```

---

## Flow 8.2: Accounting Policy

**Accessible to:** Primary Admin, Org Admin, Finance User (configure)

```
SETTINGS → Accounting Policy (/settings/accounting)
     ↓
┌─────────────────────────────────────────────┐
│  Capitalization Threshold                   │
│  ₦ [50,000] (editable)                      │
│                                             │
│  Minimum Useful Life                        │
│  [12] months (editable)                     │
│                                             │
│  Disposal Approval Threshold                │
│  ₦ [500,000] (editable)                     │
│                                             │
│  Low Value Treatment                        │
│  ○ Track as non-capitalized                 │
│  ○ Expense immediately                      │
│                                             │
│  Fiscal Year End                            │
│  [December] (select month)                  │
│                                             │
│  Default Depreciation Method               │
│  ○ Straight Line                            │
│  ○ Reducing Balance                         │
│                                             │
│  Multi-Branch Mode                          │
│  [Toggle On/Off]                            │
│                                             │
│  ⚠ Changing threshold does not              │
│  re-evaluate existing assets automatically  │
│                                             │
│  [Save Policy]                              │
└─────────────────────────────────────────────┘
     ↓
Save → Settings updated
Toast: "Accounting policy updated"
```

---

## Flow 8.3: Team Management

**Accessible to:** Primary Admin, Org Admin

```
SETTINGS → Team (/settings/team)
     ↓
TWO TABS:

TAB 1: ACTIVE MEMBERS
┌─────────────────────────────────────────────────────────┐
│  Name | Email | Role | Status | Joined | Last Active    │
│  ──────────────────────────────────────────────────── │
│  Ada Okonkwo | ada@co.ng | Asset Mgr | Active | Jan 24  │
│              Actions: [Change Role] [Suspend] [Remove]  │
└─────────────────────────────────────────────────────────┘

CHANGE ROLE:
  → Dropdown: select new role → Confirm
  → User notified of role change

SUSPEND USER:
  → Confirmation dialog
  → User can no longer log in
  → Toast: "User suspended"

REMOVE USER:
  → Confirmation dialog: "Type user email to confirm"
  → User removed from organization
  → Any asset assignments remain (not auto-cleared)

TAB 2: PENDING INVITATIONS
┌─────────────────────────────────────────────────────────┐
│  Email | Role | Invited By | Sent | Expires | Actions   │
│  ─────────────────────────────────────────────────────  │
│  james@co.ng | Finance User | You | 2d ago | 5d left    │
│  Actions: [Resend] [Cancel]                             │
└─────────────────────────────────────────────────────────┘

INVITE NEW MEMBER:
  [Invite Member] button → modal → email + role → send
```

---

## Flow 8.4: Billing and Plan

**Accessible to:** Primary Admin, Org Admin

```
SETTINGS → Billing (/settings/billing)
     ↓
CURRENT PLAN CARD:
┌─────────────────────────────────────────────┐
│  Growth Plan                                │
│  ₦480,000/year                              │
│  Renews: March 15, 2026                     │
│                                             │
│  Assets: 324 / 1,000 used                  │
│  Users: 8 / 15 used                        │
│  Branches: 3 / 5 used                      │
│                                             │
│  [Upgrade Plan]                             │
└─────────────────────────────────────────────┘
     ↓
UPGRADE PLAN:
  → Show plan comparison table
  → Select new plan
  → Redirect to Paystack payment
  → On success: plan updated immediately
     ↓
INVOICE HISTORY TABLE:
┌─────────────────────────────────────────────────────────┐
│  Invoice # | Date | Amount | Status | Actions           │
│  ─────────────────────────────────────────────────────  │
│  INV-0001 | Jan 2025 | ₦480,000 | Paid | [Download]    │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 8.5: Notification Preferences

**Accessible to:** All authenticated users (own preferences)

```
SETTINGS → Notifications (/settings/notifications)
     ↓
TOGGLE TABLE:
┌─────────────────────────────────────────────────────────┐
│  Notification Type          │ In-App │ Email            │
│  ─────────────────────────────────────────────────────  │
│  Asset assigned to me       │  [✓]   │  [✓]            │
│  Asset transferred to me    │  [✓]   │  [✓]            │
│  Maintenance task assigned  │  [✓]   │  [✓]            │
│  Maintenance task overdue   │  [✓]   │  [✓]            │
│  Warranty expiring          │  [✓]   │  [✓]            │
│  Asset disposed             │  [✓]   │  [ ]            │
│  Depreciation recorded      │  [✓]   │  [ ]            │
│  System alerts              │  [✓]   │  [✓]            │
└─────────────────────────────────────────────────────────┘
     ↓
Toggles save automatically on change
Toast: "Preferences updated"
```

---

---

# PART 9: USER PROFILE FLOW

---

## Flow 9.1: View and Update Profile

**Accessible to:** All authenticated users

```
TOPBAR → Avatar → "Profile"
     ↓
PROFILE PAGE (/profile)
     ↓
SECTION 1: Personal Information
┌─────────────────────────────────────────────┐
│  Profile Photo [upload / initials fallback] │
│  Full Name * [editable input]               │
│  Email Address [read only — contact admin]  │
│                                             │
│  [Save Changes]                             │
└─────────────────────────────────────────────┘
     ↓
SECTION 2: Security
┌─────────────────────────────────────────────┐
│  Change Password                            │
│  Current Password * [input]                 │
│  New Password * [input]                     │
│  Confirm New Password * [input]             │
│                                             │
│  [Update Password]                          │
└─────────────────────────────────────────────┘
     ↓
Password change → all refresh tokens revoked
User stays logged in on current session
     ↓
SECTION 3: Organization
┌─────────────────────────────────────────────┐
│  Organization: [Org Name]                   │
│  Your Role: [Role Badge]                    │
│  Member Since: [Date]                       │
└─────────────────────────────────────────────┘
```

---

---

# PART 10: ROLE-SPECIFIC USER JOURNEYS

---

## Journey 10.1: Finance Manager on First Day

```
RECEIVE INVITATION EMAIL
     ↓
Click invite link → ACCEPT INVITE (/accept-invite/:token)
     ↓
Set full name and password → JOIN
     ↓
DASHBOARD (Finance User view)
     ↓
SEES:
  - Total capitalized value
  - Pending recognition review count
  - Depreciation recorded this year
  - Disposal proceeds this year
     ↓
FIRST ACTIONS:
     │
     ├── Click "Pending Review" count
     │   → Asset list filtered to pending_review treatment
     │   → Review each asset
     │   → Override recognition decision if needed
     │
     ├── Check depreciation tab on key assets
     │   → Identify capitalized assets with no FY2024 depreciation
     │   → Record missing depreciation
     │
     └── Download Audit Pack
         → /reports → Export Audit Pack
         → Give to auditor
```

---

## Journey 10.2: Branch Manager Daily Use

```
LOGIN → DASHBOARD (Branch view)
     ↓
SEES:
  - My branch asset count
  - Overdue maintenance in my branch
  - Assets in maintenance status
  - Staff with assigned assets
     ↓
TYPICAL DAILY ACTIONS:
     │
     ├── Check maintenance tasks
     │   → /maintenance (filtered to own branch)
     │   → Review overdue tasks
     │   → Reassign if assignee is unavailable
     │
     ├── Add new asset received at branch
     │   → /assets/new
     │   → Branch field locked to own branch
     │   → Fill details and submit
     │
     ├── Transfer asset to another staff member
     │   → Find asset in /assets (own branch filtered)
     │   → Click Transfer
     │   → Change assignee within branch
     │
     └── Check warranty alerts
         → Dashboard expiring warranties widget
         → View affected assets
```

---

## Journey 10.3: Maintenance Staff Daily Use

```
LOGIN → DASHBOARD (My Tasks view)
     ↓
SEES:
  - My open tasks count
  - My overdue tasks
  - Tasks due today
  - Recently completed
     ↓
DAILY WORKFLOW:
     │
     ├── Check task list
     │   → /maintenance (filtered to own tasks)
     │   → Sort by due date
     │
     ├── Start a task
     │   → Click task → TASK DETAIL
     │   → Click "Start Task"
     │   → Status: in_progress
     │   → Asset status changes to maintenance
     │
     ├── Complete a task
     │   → Click "Complete Task"
     │   → Enter completion note
     │   → Submit
     │   → Asset reverts to active (if no other open tasks)
     │
     └── Report new issue (Phase 2: via QR scan)
         → Scan asset QR code
         → "Report Issue" button
         → Creates maintenance task
```

---

## Journey 10.4: External Auditor Access

```
RECEIVE INVITATION EMAIL (Auditor role)
     ↓
Accept invite → SET PASSWORD
     ↓
DASHBOARD (Audit view)
     ↓
SEES:
  - Total assets in register
  - Missing data counts
  - Disposed this year
  - Pending review count
     ↓
AUDIT WORKFLOW:
     │
     ├── Review asset register
     │   → /assets (full read access, all branches)
     │   → Filter by accounting treatment
     │   → View financial tab on any asset
     │   → View full timeline
     │
     ├── Review depreciation records
     │   → Asset detail → Depreciation tab
     │   → Verify methods and amounts
     │
     ├── Review disposal records
     │   → Asset list → filter disposed
     │   → View disposal details and proceeds
     │
     ├── Check audit dashboard
     │   → /reports/audit
     │   → Review data completeness score
     │   → Identify gaps
     │
     ├── Export audit evidence
     │   → Download Audit Pack (all sheets)
     │   → Download specific reports as needed
     │
     └── CANNOT:
         → Create, edit, or delete anything
         → Transfer assets
         → Record depreciation
         → Approve disposals
         → Access billing or settings
```

---

## Journey 10.5: Standard Staff (Asset Custodian)

```
LOGIN → DASHBOARD (My Assets view)
     ↓
SEES:
  - My assigned assets
  - My open tasks
  - Assets in maintenance
     ↓
LIMITED ACTIONS:
     │
     ├── View assigned assets
     │   → Sidebar: My Assets
     │   → See name, tag, condition, branch
     │   → Cannot see purchase cost or financial data
     │
     ├── View assigned tasks
     │   → Sidebar: My Tasks
     │   → See task details
     │   → Can start and complete tasks
     │   → Can add completion notes
     │
     ├── Scan QR code (Phase 2)
     │   → Scan asset barcode
     │   → View basic asset info
     │   → Report an issue
     │
     └── Participate in verification (Phase 2)
         → Mark assets as Found / Missing / Damaged
         → During active verification campaign
```

---

---

# PART 11: ERROR AND EDGE CASE FLOWS

---

## Flow 11.1: Unauthorized Access Attempt

```
User navigates to route their role cannot access
     ↓
Route protection checks role
     ↓
UNAUTHORIZED PAGE
┌─────────────────────────────────────────────┐
│  Access Restricted                          │
│                                             │
│  You do not have permission to view         │
│  this page.                                 │
│                                             │
│  Your role: [Role Name]                     │
│  Required: [Required Role]                  │
│                                             │
│  [Go to Dashboard]                          │
│  [Contact Administrator]                    │
└─────────────────────────────────────────────┘
```

---

## Flow 11.2: Session Expiry

```
User is active on any page
     ↓
Access token expires (silent refresh attempted)
     ↓
Refresh token valid?
     ↓
┌──────────────────────────────────────────────┐
│  YES → New access token issued silently       │
│         User never interrupted               │
│                                              │
│  NO  → Auth store cleared                    │
│         Redirect to LOGIN                    │
│         Toast: "Your session has expired.    │
│                Please sign in again."        │
└──────────────────────────────────────────────┘
```

---

## Flow 11.3: Plan Limit Reached

```
User tries to create an asset but org is at asset limit
     ↓
API returns plan limit error
     ↓
LIMIT REACHED MODAL
┌─────────────────────────────────────────────┐
│  Asset Limit Reached                        │
│                                             │
│  Your organization has reached the          │
│  [Starter] plan limit of 300 assets.        │
│                                             │
│  Current: 300 / 300 assets                  │
│                                             │
│  [View Plans]  [Contact Admin]              │
└─────────────────────────────────────────────┘
     ↓
Admin sees:
  [Upgrade Plan] button prominent
     ↓
Click Upgrade → /settings/billing → Paystack
```

---

## Flow 11.4: API Error Handling

```
Any API call fails
     ↓
Axios interceptor catches error
     ↓
┌──────────────────────────────────────────────────────────┐
│  Error type:                                             │
│                                                          │
│  400 Bad Request                                         │
│  → Show field-level errors in form                       │
│  → Toast: specific validation message                    │
│                                                          │
│  401 Unauthorized                                        │
│  → Attempt token refresh                                 │
│  → If fails: redirect to login                           │
│                                                          │
│  403 Forbidden                                           │
│  → Toast: "You do not have permission to perform         │
│            this action"                                  │
│                                                          │
│  404 Not Found                                           │
│  → Toast: "Record not found"                             │
│  → Redirect to list page                                 │
│                                                          │
│  409 Conflict                                            │
│  → Toast: specific conflict message (e.g.               │
│    "Asset tag AST-001 is already in use")                │
│                                                          │
│  429 Rate Limited                                        │
│  → Toast: "Too many requests. Please wait and try again" │
│                                                          │
│  500 Server Error                                        │
│  → Toast: "Something went wrong. Our team has            │
│            been notified. Please try again."             │
│  → Log to monitoring service                             │
└──────────────────────────────────────────────────────────┘
```

---

## Flow 11.5: Empty States

```
Any list or table with no results:
     ↓
┌─────────────────────────────────────────────┐
│  [Relevant Icon]                            │
│                                             │
│  No [items] yet                             │
│                                             │
│  [Context-specific description]             │
│                                             │
│  [Primary Action Button if applicable]      │
└─────────────────────────────────────────────┘

Examples:
  No assets → "Add your first asset or import your
               existing register to get started"
               [Add Asset] [Import Assets]

  No maintenance tasks → "No maintenance tasks yet.
                          Create your first task to
                          start tracking asset upkeep."
                          [Create Task]

  No notifications → "You are all caught up.
                      No notifications to show."
                      (no action button)

  No results from filter → "No assets match your
                            current filters."
                            [Clear Filters]
```

---

---

# PART 12: COMPLETE ROUTE MAP

---

## Every Route and Who Can Access It

| Route | Page | Roles With Access |
|---|---|---|
| `/` | Redirect | Redirects to /dashboard or /login |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/org-login` | Org Login | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password` | Reset Password | Public (with valid OTP) |
| `/accept-invite/:token` | Accept Invite | Public (with valid token) |
| `/dashboard` | Dashboard | All authenticated roles |
| `/assets` | Asset List | All except Standard Staff |
| `/assets/new` | Create Asset | Admin, Asset Manager, Branch Manager |
| `/assets/import` | Import Assets | Admin, Asset Manager |
| `/assets/:id` | Asset Detail | Admin, Asset Manager, Finance User, Branch Manager (own), Auditor, Standard Staff (assigned) |
| `/assets/:id/edit` | Edit Asset | Admin, Asset Manager, Finance User (financial fields), Branch Manager (own branch) |
| `/branches` | Branch List | Admin, Asset Manager, Finance User, Branch Manager (own), Auditor |
| `/branches/new` | Create Branch | Admin, Asset Manager |
| `/branches/:id` | Branch Detail | Admin, Asset Manager, Finance User, Branch Manager (own), Auditor |
| `/branches/:id/edit` | Edit Branch | Admin, Asset Manager, Branch Manager (own) |
| `/maintenance` | Maintenance List | Admin, Asset Manager, Branch Manager, Maintenance Staff, Standard Staff |
| `/maintenance/new` | Create Task | Admin, Asset Manager, Branch Manager, Maintenance Staff |
| `/maintenance/:id` | Task Detail | Admin, Asset Manager, Branch Manager (own), Maintenance Staff (assigned), Auditor |
| `/maintenance/:id/edit` | Edit Task | Admin, Asset Manager, Branch Manager (own), Maintenance Staff (own) |
| `/notifications` | Notifications | All authenticated roles |
| `/reports` | Reports Hub | All except Maintenance Staff and Standard Staff |
| `/reports/assets` | Asset Register | Admin, Asset Manager, Finance User, Branch Manager (own), Auditor |
| `/reports/finance` | Finance Dashboard | Admin, Finance User, Auditor |
| `/reports/maintenance` | Maintenance Report | Admin, Asset Manager, Branch Manager, Auditor |
| `/reports/audit` | Audit Dashboard | Admin, Asset Manager, Finance User, Auditor |
| `/settings` | Settings Hub | Primary Admin, Org Admin |
| `/settings/organization` | Org Profile | Primary Admin, Org Admin |
| `/settings/accounting` | Accounting Policy | Primary Admin, Org Admin, Finance User |
| `/settings/team` | Team Management | Primary Admin, Org Admin |
| `/settings/billing` | Billing and Plan | Primary Admin, Org Admin |
| `/settings/notifications` | Notification Prefs | All authenticated roles |
| `/profile` | User Profile | All authenticated roles |

---

---

# MASTER FLOW SUMMARY

```
PUBLIC ENTRY POINTS
├── /register → Organization created → Welcome screen → Dashboard
├── /login → Token issued → Dashboard
├── /org-login → Org-scoped token → Dashboard
├── /forgot-password → OTP → Reset → Login
└── /accept-invite/:token → Account created → Dashboard

AUTHENTICATED CORE LOOPS
├── Dashboard → Quick actions → Feature screens
├── Assets → Create / Edit / Transfer / Dispose / Import / Export
├── Branches → Create / View / Edit / Delete
├── Maintenance → Create / Start / Complete / Cancel
├── Notifications → View / Read / Navigate to record
├── Reports → Asset / Finance / Maintenance / Audit → Export
├── Settings → Org / Policy / Team / Billing / Preferences
└── Profile → Update / Change Password

ROLE BOUNDARIES (enforced at every entry point)
├── Branch Manager → All actions scoped to own branch
├── Maintenance Staff → Only assigned tasks and related assets
├── Finance User → Read all, write financial fields, approve disposals
├── Auditor → Read everything, write nothing except audit findings
└── Standard Staff → Own assigned assets and tasks only

CRITICAL WORKFLOW GATES
├── Disposal → Auto-approved below ₦500K, Finance approval above
├── Asset creation (Branch Manager) → Branch locked to own branch
├── Import → Admin and Asset Manager only
├── Financial fields → Asset Manager, Finance User, Admin only
├── Recognition override → Finance User and Admin only
└── Team management → Primary Admin and Org Admin only
```

---

**This is the complete approved user flow for AssetFlow.**
**Every route. Every role. Every decision point. Every outcome.**