import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { Comment } from "@/models/comment";
import * as BlogApi from "@/network/api/blog-api";
import { NotFoundError } from "@/network/http-errors";
import { formatRelativeDate } from "@/utils/utils";
import { useContext, useState } from "react";
import { Button } from "react-bootstrap";
import UserProfileLink from "../UserProfileLink";
import { AuthModalsContext } from "../auth/AuthModalsProvider";
import CreateCommentBox from "./CreateCommentBox";
import EditCommentBox from "./EditCommentBox";

//------------------------------------------------------------------------------------------------- PRIMARY COMPONENT
interface CommentComponentProps {
    comment: Comment,
    onReplyCreated: (reply: Comment) => void,
    onCommentUpdated: (updatedComment: Comment) => void,
    onCommentDeleted: (comment: Comment) => void,
}

export default function CommentComponent({ comment, onReplyCreated, onCommentUpdated, onCommentDeleted }: CommentComponentProps) {
    //--------------------------------------------------------------------------------------------- HOOKS
    const { user } = useAuthenticatedUser();
    const authModalContext = useContext(AuthModalsContext);

    //--------------------------------------------------------------------------------------------- STATES
    const [showEditBox, setShowEditBox] = useState(false);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [showDeleteBox, setShowDeleteBox] = useState(false);

    //--------------------------------------------------------------------------------------------- AUXILIARY FUNCTIONS
    function handleReplyClicked() {
        if (user) {
            setShowReplyBox(true);
            setShowDeleteBox(false);
        } else {
            authModalContext.showLoginModal();
        }
    }

    function handleEditClicked() {
        setShowEditBox(true);
        setShowDeleteBox(false);
    }

    function handleDeleteClicked() {
        setShowDeleteBox(true)
    }

    function handleCommentUpdated(updatedComment: Comment) {
        onCommentUpdated(updatedComment);
        setShowEditBox(false);
    }

    function handleReplyCreated(newReply: Comment) {
        onReplyCreated(newReply);
        setShowReplyBox(false);
    }

    //----------------------------------------------------------------------------------------------- UI STRUCTURE
    return (
        <div>
            <hr />
            {showEditBox
                ? <EditCommentBox
                    comment={comment}
                    onCommentUpdated={handleCommentUpdated}
                    onCancelClicked={() => setShowEditBox(false)}
                />
                : <CommentBox // This is the "entry point" visualized layout (initial state)
                    comment={comment}
                    onReplyClicked={handleReplyClicked}
                    onEditClicked={handleEditClicked}
                    onDeleteClicked={handleDeleteClicked}
                />
            }
            {showReplyBox &&
                <CreateCommentBox
                    postId={comment.postId}
                    boxTitle="Write a reply"
                    onCommentCreated={handleReplyCreated}
                    parentCommentId={comment.parentCommentId ?? comment._id} // explain better...
                    showCancel // the same as showCancel={true}
                    onCancelClicked={() => setShowReplyBox(false)}
                    defaultText={comment.parentCommentId ? `@${comment.author.username} ` : ""}
                />
            }
            {showDeleteBox &&
                <DeleteConfirmationBox
                    comment={comment}
                    onCommentDeleted={onCommentDeleted}
                    onCancelClicked={() => setShowDeleteBox(false)}
                />
            }
        </div>
    );
}

//--------------------------------------------------------------------------------------------- SLAVE COMPONENT
interface CommentBoxProps {
    comment: Comment,
    onReplyClicked: () => void;
    onEditClicked: () => void;
    onDeleteClicked: () => void;
}

function CommentBox({ comment, onReplyClicked, onEditClicked, onDeleteClicked }: CommentBoxProps) {
    const { user } = useAuthenticatedUser();

    const loggedInUserIsAuthor = (user && (user._id === comment.author._id)) || false;

    return (
        <div>
            <div className="mb-2">{comment.text}</div>
            <div className="d-flex gap-2 align-items-center">
                <UserProfileLink user={comment.author} />
                {formatRelativeDate(comment.createdAt)}
                {comment.updatedAt > comment.createdAt && <span>(Edited)</span>}
            </div>
            <div className="mt-1 d-flex gap-2">
                <Button variant="link" className="small" onClick={onReplyClicked}>Reply</Button>
                {loggedInUserIsAuthor &&
                    <>
                        <Button variant="link" className="small" onClick={onEditClicked}>Edit</Button>
                        <Button variant="link" className="small" onClick={onDeleteClicked}>Delete</Button>
                    </>
                }
            </div>
        </div>
    );
}

//--------------------------------------------------------------------------------------------- SLAVE COMPONENT
interface DeleteConfirmationBoxProps {
    comment: Comment,
    onCommentDeleted: (comment: Comment) => void,
    onCancelClicked: () => void;
}

function DeleteConfirmationBox({ comment, onCommentDeleted, onCancelClicked }: DeleteConfirmationBoxProps) {

    const [deleteInProgress, setDeleteInProgress] = useState(false);

    async function deleteClicked() {
        try {
            setDeleteInProgress(true);
            await BlogApi.deleteComment(comment._id);
            onCommentDeleted(comment);
        } catch (error) {
            console.error(error);
            if (error instanceof NotFoundError) {
                onCommentDeleted(comment);
            } else {
                alert(error);
            }
        } finally {
            setDeleteInProgress(false);
        }
    }

    return (
        <div>
            <p className="text-danger">Do you really want to delete this comment?</p>
            <Button
                variant="danger"
                onClick={deleteClicked}
                disabled={deleteInProgress}>
                Delete
            </Button>
            <Button
                variant="outline-danger"
                className="ms-2"
                onClick={onCancelClicked}>
                Cancel
            </Button>
        </div>
    );
}