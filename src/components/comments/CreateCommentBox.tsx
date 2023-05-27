import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { Comment } from "@/models/comment";
import * as BlogApi from "@/network/api/blog-api";
import { yupResolver } from "@hookform/resolvers/yup";
import { useContext, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import LoadingButton from "../LoadingButton";
import { AuthModalsContext } from "../auth/AuthModalsProvider";
import FormInputField from "../form/FormInputField";

//--------------------------------------------------------------------------------------------- VALIDATION
const validationSchema = yup.object({
    text: yup.string(),
});

type CreateCommentInput = yup.InferType<typeof validationSchema>;

//--------------------------------------------------------------------------------------------- COMPONENT
interface CreateCommentBoxProps {
    boxTitle: string,
    postId: string,
    parentCommentId?: string,
    onCommentCreated: (comment: Comment) => void,
    showCancel?: boolean,
    onCancelClicked?: () => void,
    defaultText?: string,
}

// Can be a top level Comment, or a second level Comment (reply)
export default function CreateCommentBox({ postId, parentCommentId, boxTitle, onCommentCreated, showCancel, onCancelClicked, defaultText }: CreateCommentBoxProps) {
    const { user } = useAuthenticatedUser();
    const authModalContext = useContext(AuthModalsContext);

    const { register, handleSubmit, formState: { isSubmitting }, reset, setFocus } = useForm<CreateCommentInput>({
        defaultValues: { text: defaultText || "" },
        resolver: yupResolver(validationSchema)
    });

    async function onSubmit({ text }: CreateCommentInput) {
        if (!text) return;
        try {
            const createdComment = await BlogApi.createComment(postId, parentCommentId, text);
            onCommentCreated(createdComment);
            reset();
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    useEffect(() => {
        if (parentCommentId) {
            setFocus("text");
        }
    }, [parentCommentId, setFocus]);

    if (!user) {
        return (
            <Button variant="outline-primary" className="mt-1" onClick={() => authModalContext.showLoginModal()}>
                Log in to write a comment
            </Button>
        );
    }

    return (
        <div className="mt-2">
            <div className="mb-1">{boxTitle}</div>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormInputField
                    register={register("text")}
                    as="textarea"
                    maxLength={600}
                    placeholder="Say something..."
                />
                <LoadingButton type="submit" isLoading={isSubmitting}>Send</LoadingButton>
                {showCancel && <Button onClick={onCancelClicked} className="ms-2" variant="outline-primay">Cancel</Button>}
            </Form>
        </div>
    );
}