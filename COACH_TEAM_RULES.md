# Coach and Team Management Rules

## Business Rules

### 1. Coach Assignment Rules
- ✅ **Coaches can only coach ONE team** (but a team can have multiple coaches)
- ✅ **Coaches cannot be shooters** on any team
- ✅ If a user has a shooter profile, they cannot be assigned as a coach
- ✅ If a user is a coach, they cannot be added as a shooter to a team

### 2. Shooter Assignment Rules
- ✅ **Shooters can only be on ONE team** at a time
- ✅ Shooters cannot join another team if they're already on a team
- ✅ Coaches and admins cannot be shooters

### 3. Admin Capabilities
- ✅ Admins can assign any coach to any team (respecting the "one team per coach" rule)
- ✅ Admins can remove coaches from teams
- ✅ Admins have full access to the **Manage Coaches** interface (`/admin/coaches`)

### 4. Coach Capabilities
- ✅ Coaches can self-assign to a team (if not already coaching)
- ✅ Coaches can leave their team
- ✅ Coaches can manage shooters on their team
- ✅ Coaches can add shooters to their team (respecting shooter rules)
- ✅ Coaches can remove shooters from their team

## Implementation Details

### Database Schema
```prisma
model Team {
  coaches TeamCoach[] // Many-to-many relationship
}

model User {
  coachedTeams TeamCoach[] // One coach can only coach one team
}

model TeamCoach {
  teamId String
  userId String
  role String @default("coach") // coach, head_coach, assistant_coach
  
  @@unique([teamId, userId]) // Prevent duplicate assignments
}
```

### Validation Flow

#### When Assigning a Coach:
1. Check if user has coach/admin role ✅
2. Check if user is a shooter (reject if true) ✅
3. Check if user is already coaching another team (reject if true) ✅
4. Create TeamCoach record ✅

#### When Adding a Shooter:
1. Check if user is a coach/admin (reject if true) ✅
2. Check if shooter is already on another team (reject if true) ✅
3. Update shooter's teamId ✅

#### When Approving Team Join Request:
1. Check if requester is a coach/admin (reject if true) ✅
2. Check if shooter is already on another team (reject if true) ✅
3. Add shooter to team and approve request ✅

## API Endpoints

### POST `/api/teams/manage`
Assign a coach to a team
- Admin can assign any coach: `{ userId, teamId }`
- Coach can self-assign: `{ teamId }`
- Enforces: one team per coach, coaches can't be shooters

### DELETE `/api/teams/manage`
Remove a coach from a team
- Admin can remove any coach: `{ userId, teamId }`
- Coach can remove themselves: `{ teamId }`

### POST `/api/teams/add-shooter`
Add a shooter to a coach's team
- Enforces: one team per shooter, coaches can't be shooters

### PUT `/api/teams/join-requests/[id]`
Approve/reject team join requests
- Enforces: one team per shooter, coaches can't be shooters

## UI Components

### `/admin/coaches`
Admin interface for managing coach assignments:
- List all coaches and their current teams
- Assign coaches to teams via dropdown
- Remove coaches from teams
- Shows warnings for users who are both coaches and shooters
- Shows teams overview with all coaches

### Validation Messages

**Coach Assignment Errors:**
- "Coaches cannot be shooters on a team. This user is already a shooter."
- "This user is already coaching another team. Coaches can only coach one team."
- "You are already coaching this team."

**Shooter Assignment Errors:**
- "Coaches and admins cannot be shooters on a team"
- "This shooter is already on another team ([Team Name]). Shooters can only be on one team."
- "This shooter is already on your team"

## Testing Checklist

- [ ] Admin can assign coach to team
- [ ] Admin cannot assign coach who is already coaching
- [ ] Admin cannot assign user who is a shooter
- [ ] Coach can self-assign to team
- [ ] Coach cannot join team if already coaching
- [ ] Shooter cannot join team if already on a team
- [ ] Coach cannot be added as shooter to team
- [ ] Team join request validates shooter rules
- [ ] Multiple coaches can be assigned to same team
- [ ] Admin coaches page displays correctly

