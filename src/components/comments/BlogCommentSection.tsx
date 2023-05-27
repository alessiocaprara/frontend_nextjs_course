import { Comment } from "@/models/comment";
import * as BlogApi from "@/network/api/blog-api";
import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import CommentThread from "./CommentThread";
import CreateCommentBox from "./CreateCommentBox";

//--------------------------------------------------------------------------------------------- COMPONENT
interface BlogCommentSectionProps {
    postId: string,
}

export default function BlogCommentSection({ postId }: BlogCommentSectionProps) {
    return (
        <CommentSection postId={postId} key={postId} />
    );
}

function CommentSection({ postId }: BlogCommentSectionProps) {
    // client side teching without SWR because the standard hook is done for discrete pagination (as done for posts)
    // we could use SWRInfinite but that doesn't work when the list is modified/deleted. So we'll do it manually with states and useEffects.

    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsLoadingIsError, setCommentsLoadingIsError] = useState(false);
    const [commentsPaginationEnd, setCommentsPaginationEnd] = useState<boolean>();

    const loadNextCommentsPage = useCallback(async function (continueAfterId?: string) {
        try {
            setCommentsLoading(true);
            setCommentsLoadingIsError(false);
            const response = await BlogApi.getCommentsForPost(postId, continueAfterId);
            if (!continueAfterId) { // we are loading the first page
                setComments(response.comments); // replace the whole array
            } else { // we are loading the second page or onward
                setComments(existingComments => [...existingComments, ...response.comments]); // we use a new object (in this case the comments array) and doon't modify the existing one otherwise React won't notice the change 
            }
            setCommentsPaginationEnd(response.endOfPaginationReached);
        } catch (error) {
            console.error(error);
            alert(error);
            setCommentsLoadingIsError(true);
        } finally {
            setCommentsLoading(false);
        }
    }, [postId])

    useEffect(() => {
        loadNextCommentsPage(); // first page
    }, [loadNextCommentsPage]);

    function handleCommentCreated(newComment: Comment) {
        setComments([newComment, ...comments]);
    }

    function handleCommentUpdated(updatedComment: Comment) {
        const update = comments.map(existingComment => existingComment._id === updatedComment._id ? { ...updatedComment, repliesCount: existingComment.repliesCount } : existingComment)
        setComments(update);
    }

    function handleCommentDeleted(deletedComment: Comment) {
        const update = comments.filter(existingComment => existingComment._id !== deletedComment._id);
        setComments(update);
    }

    return (
        <div>
            <p className="h5">Comments</p>
            <CreateCommentBox postId={postId} boxTitle="Write a comment" onCommentCreated={handleCommentCreated} />
            {comments.map(comment => (
                <CommentThread
                    comment={comment}
                    key={comment._id}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                />
            ))}
            <div className="mt-2 text-center">
                {commentsPaginationEnd && comments.length === 0 &&
                    <p>No one has posted a comment. Be the first!</p>
                }
                {commentsLoading && <Spinner animation="border" />}
                {commentsLoadingIsError && <p>Comment could not be loaded</p>}
                {!commentsLoading && !commentsPaginationEnd &&
                    <Button variant="outline-primary" onClick={() => loadNextCommentsPage(comments[comments.length - 1]._id)}>
                        Show more comments
                    </Button>
                }
            </div>
        </div>
    );
}

/**
 * 
 */