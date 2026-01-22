The Jules REST API allows you to programmatically create and manage coding sessions, monitor progress, and retrieve results. This reference documents all available endpoints, request/response formats, and data types.

## Base URL

[Section titled “Base URL”](#base-url)

All API requests should be made to:

```
https://jules.googleapis.com/v1alpha
```

## Authentication

[Section titled “Authentication”](#authentication)

The Jules REST API uses API keys for authentication. Get your API key from [jules.google.com/settings](https://jules.google.com/settings).

Terminal window

```
curl -H "x-goog-api-key: $JULES_API_KEY" \  https://jules.googleapis.com/v1alpha/sessions
```

  [Authentication Guide](/docs/api/reference/authentication)  Detailed setup instructions for API key authentication.

## Endpoints

[Section titled “Endpoints”](#endpoints)  [Sessions](/docs/api/reference/sessions)  Create and manage coding sessions. Sessions represent a unit of work where Jules executes tasks on your codebase.    [Activities](/docs/api/reference/activities)  Monitor session progress through activities. Each activity represents an event like plan generation, messages, or completion.    [Sources](/docs/api/reference/sources)  List and retrieve connected repositories. Sources represent GitHub repositories that Jules can work with.    [Types](/docs/api/reference/types)  Reference for all data types used in the API including Session, Activity, Plan, Artifact, and more.

## Common Patterns

[Section titled “Common Patterns”](#common-patterns)

### Pagination

[Section titled “Pagination”](#pagination)

List endpoints support pagination using `pageSize` and `pageToken` parameters:

Terminal window

```
# First pagecurl -H "x-goog-api-key: $JULES_API_KEY" \  "https://jules.googleapis.com/v1alpha/sessions?pageSize=10"# Next page (using token from previous response)curl -H "x-goog-api-key: $JULES_API_KEY" \  "https://jules.googleapis.com/v1alpha/sessions?pageSize=10&pageToken=NEXT_PAGE_TOKEN"
```

### Resource Names

[Section titled “Resource Names”](#resource-names)

Resources use hierarchical names following Google API conventions:

* Sessions: `sessions/{sessionId}`
* Activities: `sessions/{sessionId}/activities/{activityId}`
* Sources: `sources/{sourceId}`

### Error Handling

[Section titled “Error Handling”](#error-handling)

The API returns standard HTTP status codes:

| Status | Description |
| --- | --- |
| `200` | Success |
| `400` | Bad request - invalid parameters |
| `401` | Unauthorized - invalid or missing token |
| `403` | Forbidden - insufficient permissions |
| `404` | Not found - resource doesn’t exist |
| `429` | Rate limited - too many requests |
| `500` | Server error |

Error responses include a JSON body with details:

```
{  "error": {    "code": 400,    "message": "Invalid session ID format",    "status": "INVALID_ARGUMENT"  }}
```