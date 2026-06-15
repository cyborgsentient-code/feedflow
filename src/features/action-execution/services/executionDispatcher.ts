import type { AutomationEvent } from "@/features/automation-engine/types";
import type { ActionExecution, ActionType, ExecutionPayload, ExecutionResult, ExecutionServiceResult } from "../types";
import { actionExecutor } from "./actionExecutor";
import { mapError } from "./executionErrors";

/** Derive action type and payload from an automation event's metadata. */
function resolveAction(event: AutomationEvent): { actionType: ActionType; payload: ExecutionPayload } | null {
  // Default routing: every automation event saves the content for the user.
  // Additional action types can be added here as the system grows.
  return {
    actionType: "save_content",
    payload:    { action: "save_content", contentId: event.contentId, userId: event.userId },
  };
}

export const executionDispatcher = {
  /** Route a single automation event to the appropriate action executor. */
  async dispatch(event: AutomationEvent): Promise<ExecutionServiceResult<ExecutionResult>> {
    try {
      const resolved = resolveAction(event);
      if (!resolved) return { success: false, error: { code: "not_found", message: "No action handler for this event." } };

      const execution: ActionExecution = {
        automationEventId: event.id,
        userId:            event.userId,
        actionType:        resolved.actionType,
        payload:           resolved.payload,
      };

      return actionExecutor.execute(execution);
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
