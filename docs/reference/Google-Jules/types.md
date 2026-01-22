This page documents all data types used in the Jules REST API.

## Core Resources

[Section titled “Core Resources”](#core-resources)

### Session

[Section titled “Session”](#session)

A session represents a unit of work where Jules executes a coding task.

#### Session

A session is a contiguous amount of work within the same context.

`name`  string

Output only. The full resource name (e.g., 'sessions/{session}').

`id`  string

Output only. The session ID.

`prompt` required  string

The task description for Jules to execute.

`title`  string

Optional title. If not provided, the system generates one.

`state`  [SessionState](/docs/api/reference/types#sessionstate)

Output only. Current state of the session.

`url`  string

Output only. URL to view the session in the Jules web app.

`sourceContext` required  [SourceContext](/docs/api/reference/types#sourcecontext)

The source repository and branch context.

`requirePlanApproval`  boolean

Input only. If true, plans require explicit approval.

`automationMode`  [AutomationMode](/docs/api/reference/types#automationmode)

Input only. Automation mode for the session.

`outputs`  [SessionOutput](/docs/api/reference/types#sessionoutput) []

Output only. Results of the session (e.g., pull requests).

`createTime`  string (google-datetime)

Output only. When the session was created.

`updateTime`  string (google-datetime)

Output only. When the session was last updated.

### SessionState

[Section titled “SessionState”](#sessionstate)

Enum representing the current state of a session:

| Value | Description |
| --- | --- |
| `STATE_UNSPECIFIED` | State is unspecified |
| `QUEUED` | Session is waiting to be processed |
| `PLANNING` | Jules is creating a plan |
| `AWAITING_PLAN_APPROVAL` | Plan is ready for user approval |
| `AWAITING_USER_FEEDBACK` | Jules needs user input |
| `IN_PROGRESS` | Jules is actively working |
| `PAUSED` | Session is paused |
| `FAILED` | Session failed |
| `COMPLETED` | Session completed successfully |

### AutomationMode

[Section titled “AutomationMode”](#automationmode)

Enum for session automation settings:

| Value | Description |
| --- | --- |
| `AUTOMATION_MODE_UNSPECIFIED` | No automation (default) |
| `AUTO_CREATE_PR` | Automatically create a pull request when code changes are ready |

---

### Activity

[Section titled “Activity”](#activity)

An activity represents a single event within a session.

#### Activity

An activity is a single unit of work within a session.

`name`  string

The full resource name (e.g., 'sessions/{session}/activities/{activity}').

`id`  string

Output only. The activity ID.

`originator`  string

The entity that created this activity ('user', 'agent', or 'system').

`description`  string

Output only. A description of this activity.

`createTime`  string (google-datetime)

Output only. When the activity was created.

`artifacts`  [Artifact](/docs/api/reference/types#artifact) []

Output only. Artifacts produced by this activity.

`planGenerated`  [PlanGenerated](/docs/api/reference/types#plangenerated)

A plan was generated.

`planApproved`  [PlanApproved](/docs/api/reference/types#planapproved)

A plan was approved.

`userMessaged`  [UserMessaged](/docs/api/reference/types#usermessaged)

The user posted a message.

`agentMessaged`  [AgentMessaged](/docs/api/reference/types#agentmessaged)

Jules posted a message.

`progressUpdated`  [ProgressUpdated](/docs/api/reference/types#progressupdated)

A progress update occurred.

`sessionCompleted`  [SessionCompleted](/docs/api/reference/types#sessioncompleted)

The session completed.

`sessionFailed`  [SessionFailed](/docs/api/reference/types#sessionfailed)

The session failed.

---

### Source

[Section titled “Source”](#source)

A source represents a connected repository.

#### Source

An input source of data for a session.

`name`  string

The full resource name (e.g., 'sources/{source}').

`id`  string

Output only. The source ID.

`githubRepo`  [GitHubRepo](/docs/api/reference/types#githubrepo)

GitHub repository details.

---

## Plans

[Section titled “Plans”](#plans)

### Plan

[Section titled “Plan”](#plan)

#### Plan

A sequence of steps that Jules will take to complete the task.

`id`  string

Output only. Unique ID for this plan within a session.

`steps`  [PlanStep](/docs/api/reference/types#planstep) []

Output only. The steps in the plan.

`createTime`  string (google-datetime)

Output only. When the plan was created.

### PlanStep

[Section titled “PlanStep”](#planstep)

#### PlanStep

A single step in a plan.

`id`  string

Output only. Unique ID for this step within a plan.

`index`  integer (int32)

Output only. 0-based index in the plan.

`title`  string

Output only. The title of the step.

`description`  string

Output only. Detailed description of the step.

---

## Artifacts

[Section titled “Artifacts”](#artifacts)

### Artifact

[Section titled “Artifact”](#artifact)

#### Artifact

A single unit of data produced by an activity.

`changeSet`  [ChangeSet](/docs/api/reference/types#changeset)

Code changes produced.

`bashOutput`  [BashOutput](/docs/api/reference/types#bashoutput)

Command output produced.

`media`  [Media](/docs/api/reference/types#media)

Media file produced (e.g., image, video).

### ChangeSet

[Section titled “ChangeSet”](#changeset)

#### ChangeSet

A set of changes to be applied to a source.

`source`  string

The source this change set applies to. Format: sources/{source}

`gitPatch`  [GitPatch](/docs/api/reference/types#gitpatch)

The patch in Git format.

### GitPatch

[Section titled “GitPatch”](#gitpatch)

#### GitPatch

A patch in Git format.

`baseCommitId`  string

The commit ID the patch should be applied to.

`unidiffPatch`  string

The patch in unified diff format.

`suggestedCommitMessage`  string

A suggested commit message for the patch.

### BashOutput

[Section titled “BashOutput”](#bashoutput)

#### BashOutput

Output from a bash command.

`command`  string

The bash command that was executed.

`output`  string

Combined stdout and stderr output.

`exitCode`  integer (int32)

The exit code of the command.

### Media

[Section titled “Media”](#media)

#### Media

A media file output.

`mimeType`  string

The MIME type of the media (e.g., 'image/png').

`data`  string (byte)

Base64-encoded media data.

---

## GitHub Types

[Section titled “GitHub Types”](#github-types)

### GitHubRepo

[Section titled “GitHubRepo”](#githubrepo)

#### GitHubRepo

A GitHub repository.

`owner`  string

The repository owner (user or organization).

`repo`  string

The repository name.

`isPrivate`  boolean

Whether the repository is private.

`defaultBranch`  [GitHubBranch](/docs/api/reference/types#githubbranch)

The default branch.

`branches`  [GitHubBranch](/docs/api/reference/types#githubbranch) []

List of active branches.

### GitHubBranch

[Section titled “GitHubBranch”](#githubbranch)

#### GitHubBranch

A GitHub branch.

`displayName`  string

The branch name.

### GitHubRepoContext

[Section titled “GitHubRepoContext”](#githubrepocontext)

#### GitHubRepoContext

Context for using a GitHub repo in a session.

`startingBranch` required  string

The branch to start the session from.

---

## Context Types

[Section titled “Context Types”](#context-types)

### SourceContext

[Section titled “SourceContext”](#sourcecontext)

#### SourceContext

Context for how to use a source in a session.

`source` required  string

The source resource name. Format: sources/{source}

`githubRepoContext`  [GitHubRepoContext](/docs/api/reference/types#githubrepocontext)

Context for GitHub repositories.

---

## Output Types

[Section titled “Output Types”](#output-types)

### SessionOutput

[Section titled “SessionOutput”](#sessionoutput)

#### SessionOutput

An output of a session.

`pullRequest`  [PullRequest](/docs/api/reference/types#pullrequest)

A pull request created by the session.

### PullRequest

[Section titled “PullRequest”](#pullrequest)

#### PullRequest

A pull request.

`url`  string

The URL of the pull request.

`title`  string

The title of the pull request.

`description`  string

The description of the pull request.

---

## Activity Event Types

[Section titled “Activity Event Types”](#activity-event-types)

### PlanGenerated

[Section titled “PlanGenerated”](#plangenerated)

#### PlanGenerated

A plan was generated.

`plan`  [Plan](/docs/api/reference/types#plan)

The generated plan.

### PlanApproved

[Section titled “PlanApproved”](#planapproved)

#### PlanApproved

A plan was approved.

`planId`  string

The ID of the approved plan.

### UserMessaged

[Section titled “UserMessaged”](#usermessaged)

#### UserMessaged

The user posted a message.

`userMessage`  string

The message content.

### AgentMessaged

[Section titled “AgentMessaged”](#agentmessaged)

#### AgentMessaged

Jules posted a message.

`agentMessage`  string

The message content.

### ProgressUpdated

[Section titled “ProgressUpdated”](#progressupdated)

#### ProgressUpdated

A progress update occurred.

`title`  string

The title of the update.

`description`  string

Details about the progress.

### SessionCompleted

[Section titled “SessionCompleted”](#sessioncompleted)

#### SessionCompleted

The session completed successfully.

No additional properties.

### SessionFailed

[Section titled “SessionFailed”](#sessionfailed)

#### SessionFailed

The session failed.

`reason`  string

The reason for the failure.

---

## Request/Response Types

[Section titled “Request/Response Types”](#requestresponse-types)

### SendMessageRequest

[Section titled “SendMessageRequest”](#sendmessagerequest)

#### SendMessageRequest

Request to send a message to a session.

`prompt` required  string

The message to send.

### SendMessageResponse

[Section titled “SendMessageResponse”](#sendmessageresponse)

#### SendMessageResponse

Response from sending a message.

Empty response on success.

### ApprovePlanRequest

[Section titled “ApprovePlanRequest”](#approveplanrequest)

#### ApprovePlanRequest

Request to approve a plan.

Empty request body.

### ApprovePlanResponse

[Section titled “ApprovePlanResponse”](#approveplanresponse)

#### ApprovePlanResponse

Response from approving a plan.

Empty response on success.

### ListSessionsResponse

[Section titled “ListSessionsResponse”](#listsessionsresponse)

#### ListSessionsResponse

Response from listing sessions.

`sessions`  [Session](/docs/api/reference/types#session) []

The list of sessions.

`nextPageToken`  string

Token for the next page of results.

### ListActivitiesResponse

[Section titled “ListActivitiesResponse”](#listactivitiesresponse)

#### ListActivitiesResponse

Response from listing activities.

`activities`  [Activity](/docs/api/reference/types#activity) []

The list of activities.

`nextPageToken`  string

Token for the next page of results.

### ListSourcesResponse

[Section titled “ListSourcesResponse”](#listsourcesresponse)

#### ListSourcesResponse

Response from listing sources.

`sources`  [Source](/docs/api/reference/types#source) []

The list of sources.

`nextPageToken`  string

Token for the next page of results.