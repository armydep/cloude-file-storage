# Phase 5, Slice 4: Create folders from the Android client

**Issue:** #52  
**Blocks:** None  
**Blocked by:** #51 (Slice 3: Browse files and folders)

A signed-in user can create a child folder in the folder they are currently viewing via a "Create folder" dialog. Folder name validation is performed locally and by the backend. On success, the current folder is refreshed and the new folder appears in the list. On failure, an inline error message is shown without closing the dialog.

## Outcome

A user can create a new folder with a valid name in any folder they own. The folder appears in the folder listing after creation.

## Acceptance criteria

- [ ] A "Create folder" button or action appears on the folder screen (AppBar or FAB).
- [ ] Tapping the action opens a dialog with a text field for the folder name and a "Create" button.
- [ ] Client-side validation rejects empty names and names longer than 255 characters locally before sending to the API.
- [ ] Submitting valid input calls `POST /api/v1/files/folders` with `parent_path` and `name`.
- [ ] On success (201), the dialog closes and the current folder refreshes to show the new folder in the list.
- [ ] On validation error from backend (409 duplicate, 422 invalid name), the error is shown inline in the dialog (not as a toast).
- [ ] On network or server errors (4xx, 5xx, timeout), a user-friendly error message is shown inline without closing the dialog.
- [ ] The "Create" button is disabled during the API request and shows no visible loading state (disabled is the feedback).
- [ ] Closing the dialog (back button, cancel, or outside tap) discards the entered name without creating a folder.
- [ ] Repository tests cover success, validation error, duplicate name, network failure, and server error.
- [ ] Widget tests cover dialog open, text input, button disabled state, error display, and dialog close.

## API contract

```
POST /api/v1/files/folders
  Headers: Authorization: Bearer <token>
  Body:
    {
      "parent_path": "root",  // or "root.Documents"
      "name": "New Folder"
    }
  Returns: FolderPublic (201 Created)
    {
      "id": "uuid",
      "name": "New Folder",
      "path": "root.NewFolder",
      "owner_id": "uuid",
      "parent_id": "uuid",
      "created_at": "2026-08-07T00:00:00Z"
    }
  Errors:
    404: Parent folder not found
    409: Folder name already exists
    422: Folder name is invalid
```

## Architecture decisions

**Folder name validation:**
- Local validation: max 255 chars, non-empty, alphanumeric + space/dash/underscore
- Backend validation: ltree path compatibility, uniqueness per parent
- Invalid local input is rejected immediately; backend errors are shown inline for recovery

**Error handling:**
- Inline dialog errors (not toast/snackbar) keep context and allow retry without reopening
- User-friendly messages: map 409 to "Folder already exists", 422 to "Invalid folder name", 5xx to "Server error"
- Network timeout: "Connection lost. Please check your network and try again."

**Dialog lifecycle:**
- Dialog stays open on error so user can edit and retry
- Closing dialog discards input (no save/restore)
- On success, dialog auto-closes and folder list refreshes

**Loading feedback:**
- Create button disabled during request (no spinner, no text change)
- Simpler than spinner, clear enough for single-action dialog

**Folder hierarchy:**
- New folder is created as a direct child of `current_path` (parent_path in API)
- No nested folder creation in one step
- User can navigate and create deeper hierarchy step-by-step

## State management

**State to add:**
- `isCreatingFolder: bool` — true while request is in flight
- `createError: String?` — error message to show inline (null if no error)

**FoldersController additions:**
- `createFolder(String name) async` — validates locally, calls API, handles errors
- State transitions: normal → loading → success (refresh) or error (keep dialog open)

## Out of scope

- Bulk folder creation
- Folder templates or defaults
- Nested folder creation (A/B/C in one step)
- Renaming folders (separate slice)
- Folder deletion
- Folder search or filtering
- Permission-based folder visibility
- Folder descriptions or metadata
- Undo/redo for creation

## Open questions (resolved)

**Q: Navigate into new folder or stay?**  
A: Stay and refresh. User sees the new folder in the list and can tap to enter.

**Q: Validate locally only, or client + backend?**  
A: Client + backend. Quick local check prevents unnecessary API calls; backend validates for consistency.

**Q: Toast or inline errors?**  
A: Inline in dialog. Keeps context and allows retry without reopening.

**Q: Loading spinner on button or just disable?**  
A: Disable only (no spinner). Simpler; clear enough for single-action dialog.

## Testing strategy

**Repository/API:**
- Mock API success (201, folder created)
- Mock 404 (parent not found)
- Mock 409 (duplicate name)
- Mock 422 (invalid name)
- Mock 500 (server error)
- Mock network error (timeout/exception)

**Widget:**
- Dialog opens and closes
- Text input captures folder name
- Button disabled during request
- Error message displays inline
- Successful creation refreshes folder list
- Retry after error without reopening dialog

**Integration:**
- User creates folder in root
- User navigates to subfolder and creates nested folder
- User sees error and successfully retries with different name

## Next slice: Slice 5

Once folder creation is stable, the next slice is **Download and open a file on Android** (#53), which adds file download actions to the file list.
