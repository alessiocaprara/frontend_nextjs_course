import { Comment } from "@/models/comment";
import * as BlogApi from "@/network/api/blog-api";
import { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import CommentComponent from "./CommentComponent";

//---------------------------------------------------------------------------------------- PRIMARY COMPONENT
interface CommentThreadProps {
    comment: Comment,
    onCommentUpdated: (updatedComment: Comment) => void,
    onCommentDeleted: (comment: Comment) => void,
}

export default function CommentThread({ comment, onCommentUpdated, onCommentDeleted }: CommentThreadProps) {

    const [replies, setReplies] = useState<Comment[]>([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [repliesLoadingIsError, setRepliesLoadingIsError] = useState(false);
    const [repliesPaginationEnd, setRepliesPaginationEnd] = useState<boolean>();

    const [localReplies, setLocalReplies] = useState<Comment[]>([]);

    async function loadNextRepliesPage() {
        const continueAfterId = replies[replies.length - 1]?._id // ?? ??
        try {
            setRepliesLoading(true);
            setRepliesLoadingIsError(false);
            const response = await BlogApi.getRepliesForComment(comment._id, continueAfterId);
            setReplies([...replies, ...response.comments]);
            setRepliesPaginationEnd(response.endOfPaginationReached);
            setLocalReplies([]);
        } catch (error) {
            console.error(error);
            setRepliesLoadingIsError(true);
        } finally {
            setRepliesLoading(false);
        }
    }

    function handleReplyCreated(reply: Comment) {
        setLocalReplies([...localReplies, reply]);
    }

    function handleRemoteReplyUpdated(updatedReply: Comment) {
        const update = replies.map(existingReply => existingReply._id === updatedReply._id ? updatedReply : existingReply);
        setReplies(update);
    }

    function handleRemoteReplyDeleted(deletedReply: Comment) {
        const update = replies.filter(reply => reply._id !== deletedReply._id);
        setReplies(update);
    }

    function handleLocalReplyUpdated(updatedReply: Comment) {
        const update = localReplies.map(existingReply => existingReply._id === updatedReply._id ? updatedReply : existingReply);
        setLocalReplies(update);
    }

    function handleLocalReplyDeleted(deletedReply: Comment) {
        const update = localReplies.filter(reply => reply._id !== deletedReply._id);
        setLocalReplies(update);
    }

    const showLoadRepliesButton = !!comment.repliesCount && !repliesLoading && !repliesPaginationEnd

    return (
        <div>
            <CommentComponent
                comment={comment}
                onReplyCreated={handleReplyCreated}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
            />
            <Replies
                replies={replies}
                onReplyCreated={handleReplyCreated}
                onReplyUpdated={handleRemoteReplyUpdated}
                onReplyDeleted={handleRemoteReplyDeleted}
            />
            <div className="mt-2 text-center">
                {repliesLoading && <Spinner animation="border" />}
                {repliesLoadingIsError && <p>Replies could not be loaded</p>}
                {showLoadRepliesButton &&
                    <Button variant="outline-primary" onClick={loadNextRepliesPage}>
                        {
                            repliesPaginationEnd === undefined
                                ? `Show ${comment.repliesCount} ${comment.repliesCount === 1 ? "reply" : "replies"}`
                                : "Show more replies"
                        }
                    </Button>
                }
            </div>
            <Replies
                replies={localReplies}
                onReplyCreated={handleReplyCreated}
                onReplyUpdated={handleLocalReplyUpdated}
                onReplyDeleted={handleLocalReplyDeleted}
            />
        </div>
    );
}

//---------------------------------------------------------------------------------------- SLAVE COMPONENT
interface RepliesProps {
    replies: Comment[],
    onReplyCreated: (reply: Comment) => void,
    onReplyUpdated: (updatedReply: Comment) => void,
    onReplyDeleted: (deletedReply: Comment) => void,
}

function Replies({ replies, onReplyCreated, onReplyDeleted, onReplyUpdated }: RepliesProps) {
    return (
        <div className="ms-5">
            {
                replies.map(reply => (
                    <CommentComponent
                        comment={reply}
                        key={reply._id}
                        onReplyCreated={onReplyCreated}
                        onCommentUpdated={onReplyUpdated}
                        onCommentDeleted={onReplyDeleted}
                    />
                ))
            }
        </div>
    );
}