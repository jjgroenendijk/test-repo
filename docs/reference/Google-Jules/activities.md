Activities represent events that occur during a session. Use the Activities API to monitor progress, retrieve messages, and access artifacts like code changes.

## List Activities

[Section titled “List Activities”](#list-activities)GET `/v1alpha/sessions/{sessionId}/activities`

Lists all activities for a session.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters)`parent` required  string  path

The parent session. Format: sessions/{session}

Pattern: `^sessions/[^/]+$`

### Query Parameters

[Section titled “Query Parameters”](#query-parameters)`pageSize`  integer  query

Number of activities to return (1-100). Defaults to 50.

`pageToken`  string  query

Page token from a previous ListActivities response.

### Example Request

[Section titled “Example Request”](#example-request)

Terminal window

```
curl -H "x-goog-api-key: $JULES_API_KEY" \  "https://jules.googleapis.com/v1alpha/1234567/activities?pageSize=20"
```

### Response

[Section titled “Response”](#response)

```
{  "activities": [    {      "name": "1234567/activities/act1",      "id": "act1",      "originator": "system",      "description": "Session started",      "createTime": "2024-01-15T10:30:00Z"    },    {      "name": "1234567/activities/act2",      "id": "act2",      "originator": "agent",      "description": "Plan generated",      "planGenerated": {        "plan": {          "id": "plan1",          "steps": [            {              "id": "step1",              "index": 0,              "title": "Analyze existing code",              "description": "Review the authentication module structure"            },            {              "id": "step2",              "index": 1,              "title": "Write unit tests",              "description": "Create comprehensive test coverage"            }          ],          "createTime": "2024-01-15T10:31:00Z"        }      },      "createTime": "2024-01-15T10:31:00Z"    }  ],  "nextPageToken": "eyJvZmZzZXQiOjIwfQ=="}
```

## Get an Activity

[Section titled “Get an Activity”](#get-an-activity)GET `/v1alpha/sessions/{sessionId}/activities/{activityId}`

Retrieves a single activity by ID.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters-1)`name` required  string  path

The resource name of the activity. Format: sessions/{session}/activities/{activity}

Pattern: `^sessions/[^/]+/activities/[^/]+$`

### Example Request

[Section titled “Example Request”](#example-request-1)

Terminal window

```
curl -H "x-goog-api-key: $JULES_API_KEY" \  https://jules.googleapis.com/v1alpha/1234567/activities/act2
```

### Response

[Section titled “Response”](#response-1)

Returns the full [Activity](/docs/api/reference/types#activity) object:

```
{  "name": "1234567/activities/act2",  "id": "act2",  "originator": "agent",  "description": "Code changes ready",  "createTime": "2024-01-15T11:00:00Z",  "artifacts": [    {      "changeSet": {        "source": "sources/github-myorg-myrepo",        "gitPatch": {          "baseCommitId": "a1b2c3d4",          "unidiffPatch": "diff --git a/tests/auth.test.js...",          "suggestedCommitMessage": "Add unit tests for authentication module"        }      }    }  ]}
```

## Activity Types

[Section titled “Activity Types”](#activity-types)

Activities have different types based on what occurred. Each activity will have exactly one of these event fields populated:

### Plan Generated

[Section titled “Plan Generated”](#plan-generated)

Indicates Jules has created a plan for the task:

```
{  "planGenerated": {    "plan": {      "id": "plan1",      "steps": [        { "id": "step1", "index": 0, "title": "Step title", "description": "Details" }      ],      "createTime": "2024-01-15T10:31:00Z"    }  }}
```

### Plan Approved

[Section titled “Plan Approved”](#plan-approved)

Indicates a plan was approved (by user or auto-approved):

```
{  "planApproved": {    "planId": "plan1"  }}
```

### User Messaged

[Section titled “User Messaged”](#user-messaged)

A message from the user:

```
{  "userMessaged": {    "userMessage": "Please also add integration tests"  }}
```

### Agent Messaged

[Section titled “Agent Messaged”](#agent-messaged)

A message from Jules:

```
{  "agentMessaged": {    "agentMessage": "I've completed the unit tests. Would you like me to add integration tests as well?"  }}
```

### Progress Updated

[Section titled “Progress Updated”](#progress-updated)

A status update during execution:

```
{  "progressUpdated": {    "title": "Writing tests",    "description": "Creating test cases for login functionality"  }}
```

### Session Completed

[Section titled “Session Completed”](#session-completed)

The session finished successfully:

```
{  "sessionCompleted": {}}
```

### Session Failed

[Section titled “Session Failed”](#session-failed)

The session encountered an error:

```
{  "sessionFailed": {    "reason": "Unable to install dependencies"  }}
```

## Artifacts

[Section titled “Artifacts”](#artifacts)

Activities may include artifacts—outputs produced during execution:

### Code Changes (ChangeSet)

[Section titled “Code Changes (ChangeSet)”](#code-changes-changeset)

```
{  "artifacts": [    {      "changeSet": {        "source": "sources/github-myorg-myrepo",        "gitPatch": {          "baseCommitId": "a1b2c3d4e5f6",          "unidiffPatch": "diff --git a/src/auth.js b/src/auth.js\n...",          "suggestedCommitMessage": "Add authentication tests"        }      }    }  ]}
```

### Bash Output

[Section titled “Bash Output”](#bash-output)

```
{  "artifacts": [    {      "bashOutput": {        "command": "npm test",        "output": "All tests passed (42 passing)",        "exitCode": 0      }    }  ]}
```

### Media

[Section titled “Media”](#media)

```
{  "artifacts": [    {      "media": {        "mimeType": "image/png",        "data": "base64-encoded-data..."      }    }  ]}
```