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

type EditCommentInput = yup.InferType<typeof validationSchema>;

//--------------------------------------------------------------------------------------------- COMPONENT
interface EditCommentBoxProps {
    comment: Comment,
    onCommentUpdated: (updatedComment: Comment) => void,
    onCancelClicked: () => void,
}

export default function EditCommentBox({ comment, onCommentUpdated, onCancelClicked }: EditCommentBoxProps) {
    const { user } = useAuthenticatedUser();
    const authModalContext = useContext(AuthModalsContext);

    const { register, handleSubmit, formState: { isSubmitting }, setFocus } = useForm<EditCommentInput>({
        defaultValues: { text: comment.text },
        resolver: yupResolver(validationSchema),
    });

    useEffect(() => {
        setFocus("text");
    }, [setFocus]);

    async function onSubmit({ text }: EditCommentInput) {
        if (!text) return;
        try {
            const updatedComment = await BlogApi.updateComment(comment._id, text);
            onCommentUpdated(updatedComment);
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    return (
        <div className="mt-2">
            <div className="mb-1">Edit comment</div>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormInputField
                    register={register("text")}
                    as="textarea"
                    maxLength={600}
                />
                <LoadingButton type="submit" isLoading={isSubmitting}>Submit</LoadingButton>
                <Button onClick={onCancelClicked} className="ms-2" variant="outline-primary">Cancel</Button>
            </Form>
        </div>
    );
}