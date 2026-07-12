# Litmo Design Principles

## Trust is Earned Before It Is Requested

This is a foundational principle of Litmo.

The product should never ask users for trust before demonstrating respect for their autonomy.

Practical implications:

- No unnecessary permissions during onboarding.
- Explain every permission before the operating system asks for it.
- Never request contacts simply because they might be useful.
- No account wall before the user understands the product.
- No subscription prompts before meaningful value has been delivered.
- Privacy is the default state.
- Every request for data must have a clear, user-centered purpose.

When evaluating any feature, ask:

> Have we earned the right to ask this of the user?

If the answer is no, redesign the experience.

Respect comes before engagement.
Trust comes before growth.
The relationship with the user is more important than short-term metrics.

## Protected Time Must Remain Protected

Litmo should never compete with sleep, work, rest, focused attention, or the user's chosen boundaries.

When a user has intentionally entered a protected period, Litmo should become quiet. Non-urgent notifications, reminders, prompts, streaks, engagement messages, and requests for attention must wait.

Practical implications:

- Respect iOS Focus and notification-delivery behavior rather than attempting to bypass it.
- Never mark ordinary Litmo notifications as time-sensitive or critical merely to get through a Focus.
- Provide a simple Litmo Quiet Schedule for users who want explicit control, without requiring HealthKit or wearable data.
- Quiet schedules should support sleep hours, work hours, custom recurring periods, temporary pauses, and time-zone changes.
- During quiet periods, collect non-urgent activity into a calm digest delivered after the period ends.
- The user may choose trusted exceptions, but Litmo must not pressure them to create exceptions.
- HealthKit sleep information may be offered only as an optional enhancement, never as a requirement and never as the sole mechanism for protecting sleep.
- Emergency or safety functionality must be narrowly defined, transparent, user-controlled, and technically distinct from ordinary engagement notifications.

When evaluating a notification, ask:

> Is this worth interrupting the life the user explicitly chose to protect?

Unless the answer is clearly yes under rules the user selected, wait.

Litmo should fit around a person's life. A person's life should never be organized around Litmo.
