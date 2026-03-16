import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIToolInvocation } from "ai";
import type { ChatMessage } from "@/shared/lib/chat.schema";
import type { ReadToolType } from "@/shared/tools/read";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "../ai-elements/confirmation";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "../ai-elements/tool";

type ReadToolProps = {
  part: UIToolInvocation<ReadToolType>;
  addToolOutput: UseChatHelpers<ChatMessage>["addToolOutput"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
};

export const ReadTool = ({ part, addToolOutput, addToolApprovalResponse }: ReadToolProps) => {
  return (
    <Tool
      defaultOpen={
        part.state === "input-available" || part.state === "input-streaming" || part.state === "approval-requested"
      }
      key={part.toolCallId}
    >
      <ToolHeader state={part.state} title={part.title} toolName="read" type="dynamic-tool" />
      <ToolContent>
        <ToolInput input={part.input || ""} />
        {part.state === "approval-requested" && (
          <Confirmation
            approval={{ approved: part.approval.approved, id: part.toolCallId, reason: part.approval.reason }}
            state="approval-requested"
          >
            <ConfirmationTitle>
              <ConfirmationRequest>This tool will read files from your local workspace.</ConfirmationRequest>
              <ConfirmationAccepted>
                <span>Accepted</span>
              </ConfirmationAccepted>
              <ConfirmationRejected>
                <span>Rejected</span>
              </ConfirmationRejected>
            </ConfirmationTitle>
            <ConfirmationActions>
              <ConfirmationAction
                onClick={() =>
                  part.approval.id
                    ? addToolApprovalResponse({
                        id: part.approval.id,
                        approved: false,
                      })
                    : addToolOutput({
                        tool: "read",
                        toolCallId: part.toolCallId,
                        output: "No, denied.",
                      })
                }
                variant="outline"
              >
                Reject
              </ConfirmationAction>
              <ConfirmationAction
                onClick={() =>
                  part.approval.id
                    ? addToolApprovalResponse({
                        id: part.approval.id,
                        approved: true,
                      })
                    : addToolOutput({
                        tool: "read",
                        toolCallId: part.toolCallId,
                        output: "Yes, confirmed.",
                      })
                }
                variant="default"
              >
                Accept
              </ConfirmationAction>
            </ConfirmationActions>
          </Confirmation>
        )}
        {part.state === "approval-responded" && (
          <Confirmation
            approval={{
              approved: part.approval.approved,
              id: part.toolCallId,
              reason: part.approval.reason,
            }}
            state="approval-requested"
          >
            <ConfirmationTitle>
              <ConfirmationRequest>This tool will read files from your local workspace.</ConfirmationRequest>
              <ConfirmationAccepted>
                <span>Accepted</span>
              </ConfirmationAccepted>
              <ConfirmationRejected>
                <span>Rejected</span>
              </ConfirmationRejected>
            </ConfirmationTitle>
          </Confirmation>
        )}
        <ToolOutput errorText={part.errorText} output={part.output || ""} />
      </ToolContent>
    </Tool>
  );
};
