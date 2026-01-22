Sessions are the core resource in the Jules REST API. A session represents a unit of work where Jules executes a coding task on your repository.

## Create a Session

[Section titled “Create a Session”](#create-a-session)POST `/v1alpha/sessions`

Creates a new session to start a coding task.

### Request Body

[Section titled “Request Body”](#request-body)`prompt` required  string

The task description for Jules to execute.

`title`  string

Optional title for the session. If not provided, the system will generate one.

`sourceContext` required  [SourceContext](/docs/api/reference/types#sourcecontext)

The source repository and branch context for this session.

`requirePlanApproval`  boolean

If true, plans require explicit approval before execution. If not set, plans are auto-approved.

`automationMode`  string

Automation mode. Use 'AUTO\_CREATE\_PR' to automatically create pull requests when code changes are ready.

### Example Request

[Section titled “Example Request”](#example-request)

Terminal window

```
curl -X POST \  -H "x-goog-api-key: $JULES_API_KEY" \  -H "Content-Type: application/json" \  -d '{    "prompt": "Add comprehensive unit tests for the authentication module",    "title": "Add auth tests",    "sourceContext": {      "source": "sources/github-myorg-myrepo",      "githubRepoContext": {        "startingBranch": "main"      }    },    "requirePlanApproval": true  }' \  https://jules.googleapis.com/v1alpha/sessions
```

### Response

[Section titled “Response”](#response)

Returns the created [Session](/docs/api/reference/types#session) object:

```
{  "name": "1234567",  "id": "abc123",  "prompt": "Add comprehensive unit tests for the authentication module",  "title": "Add auth tests",  "state": "QUEUED",  "url": "https://jules.google.com/session/abc123",  "createTime": "2024-01-15T10:30:00Z",  "updateTime": "2024-01-15T10:30:00Z"}
```

## List Sessions

[Section titled “List Sessions”](#list-sessions)GET `/v1alpha/sessions`

Lists all sessions for the authenticated user.

### Query Parameters

[Section titled “Query Parameters”](#query-parameters)`pageSize`  integer  query

Number of sessions to return (1-100). Defaults to 30.

`pageToken`  string  query

Page token from a previous ListSessions response.

### Example Request

[Section titled “Example Request”](#example-request-1)

Terminal window

```
curl -H "x-goog-api-key: $JULES_API_KEY" \  "https://jules.googleapis.com/v1alpha/sessions?pageSize=10"
```

### Response

[Section titled “Response”](#response-1)

```
{  "sessions": [    {      "name": "1234567",      "id": "abc123",      "title": "Add auth tests",      "state": "COMPLETED",      "createTime": "2024-01-15T10:30:00Z",      "updateTime": "2024-01-15T11:45:00Z"    }  ],  "nextPageToken": "eyJvZmZzZXQiOjEwfQ=="}
```

## Get a Session

[Section titled “Get a Session”](#get-a-session)GET `/v1alpha/sessions/{sessionId}`

Retrieves a single session by ID.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters)`name` required  string  path

The resource name of the session. Format: sessions/{session}

Pattern: `^sessions/[^/]+$`

### Example Request

[Section titled “Example Request”](#example-request-2)

Terminal window

```
curl -H "x-goog-api-key: $JULES_API_KEY" \  https://jules.googleapis.com/v1alpha/1234567
```

### Response

[Section titled “Response”](#response-2)

Returns the full [Session](/docs/api/reference/types#session) object including outputs if the session has completed:

```
{  "name": "1234567",  "id": "abc123",  "prompt": "Add comprehensive unit tests for the authentication module",  "title": "Add auth tests",  "state": "COMPLETED",  "url": "https://jules.google.com/session/abc123",  "createTime": "2024-01-15T10:30:00Z",  "updateTime": "2024-01-15T11:45:00Z",  "outputs": [    {      "pullRequest": {        "url": "https://github.com/myorg/myrepo/pull/42",        "title": "Add auth tests",        "description": "Added unit tests for authentication module"      }    }  ]}
```

## Delete a Session

[Section titled “Delete a Session”](#delete-a-session)DELETE `/v1alpha/sessions/{sessionId}`

Deletes a session.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters-1)`name` required  string  path

The resource name of the session to delete. Format: sessions/{session}

Pattern: `^sessions/[^/]+$`

### Example Request

[Section titled “Example Request”](#example-request-3)

Terminal window

```
curl -X DELETE \  -H "x-goog-api-key: $JULES_API_KEY" \  https://jules.googleapis.com/v1alpha/1234567
```

### Response

[Section titled “Response”](#response-3)

Returns an empty response on success.

## Send a Message

[Section titled “Send a Message”](#send-a-message)POST `/v1alpha/sessions/{sessionId}:sendMessage`

Sends a message from the user to an active session.

Use this endpoint to provide feedback, answer questions, or give additional instructions to Jules during an active session.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters-2)`session` required  string  path

The resource name of the session. Format: sessions/{session}

Pattern: `^sessions/[^/]+$`

### Request Body

[Section titled “Request Body”](#request-body-1)`prompt` required  string

The message to send to the session.

### Example Request

[Section titled “Example Request”](#example-request-4)

Terminal window

```
curl -X POST \  -H "x-goog-api-key: $JULES_API_KEY" \  -H "Content-Type: application/json" \  -d '{    "prompt": "Please also add integration tests for the login flow"  }' \  https://jules.googleapis.com/v1alpha/1234567:sendMessage
```

### Response

[Section titled “Response”](#response-4)

Returns an empty [SendMessageResponse](/docs/api/reference/types#sendmessageresponse) on success.

## Approve a Plan

[Section titled “Approve a Plan”](#approve-a-plan)POST `/v1alpha/sessions/{sessionId}:approvePlan`

Approves a pending plan in a session.

This endpoint is only needed when `requirePlanApproval` was set to `true` when creating the session.

### Path Parameters

[Section titled “Path Parameters”](#path-parameters-3)`session` required  string  path

The resource name of the session. Format: sessions/{session}

Pattern: `^sessions/[^/]+$`

### Example Request

[Section titled “Example Request”](#example-request-5)

Terminal window

```
curl -X POST \  -H "x-goog-api-key: $JULES_API_KEY" \  -H "Content-Type: application/json" \  -d '{}' \  https://jules.googleapis.com/v1alpha/1234567:approvePlan
```

### Response

[Section titled “Response”](#response-5)

Returns an empty [ApprovePlanResponse](/docs/api/reference/types#approveplanresponse) on success.

## Session States

[Section titled “Session States”](#session-states)

Sessions progress through the following states:

| State | Description |
| --- | --- |
| `QUEUED` | Session is waiting to be processed |
| `PLANNING` | Jules is analyzing the task and creating a plan |
| `AWAITING_PLAN_APPROVAL` | Plan is ready and waiting for user approval |
| `AWAITING_USER_FEEDBACK` | Jules needs additional input from the user |
| `IN_PROGRESS` | Jules is actively working on the task |
| `PAUSED` | Session is paused |
| `COMPLETED` | Task completed successfully |
| `FAILED` | Task failed to complete |