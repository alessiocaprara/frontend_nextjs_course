import ConfirmationModal from "@/components/ConfirmationModal";
import LoadingButton from "@/components/LoadingButton";
import FormInputField from "@/components/form/FormInputField";
import MarkdownEditor from "@/components/form/MarkdownEditor";
import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import useUnsavedChangesWarning from "@/hooks/useUnsavedChangesWarining";
import { BlogPost } from "@/models/blog-post";
import * as BlogApi from "@/network/api/blog-api";
import { NotFoundError } from "@/network/http-errors";
import { generateSlug } from "@/utils/utils";
import { requiredStringSchema, slugSchema } from "@/utils/validation";
import { yupResolver } from "@hookform/resolvers/yup";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";

//------------------------------------------------------------------------------------------------------- SERVER SIDE RENDERING
export const getServerSideProps: GetServerSideProps<EditBlogPostPageProps> = async ({ params }) => {
    try {
        const slug = params?.slug?.toString();
        if (!slug) throw Error("slug missing");
        const post = await BlogApi.getBlogPostBySlug(slug);
        return { props: { post } };
    } catch (error) {
        if (error instanceof NotFoundError) {
            return { notFound: true }
        } else {
            throw error;
        }
    }
}

//-------------------------------------------------------------------------------------------------------- VALIDATION
const validationSchema = yup.object({
    slug: slugSchema.required("Required"),
    title: requiredStringSchema,
    summary: requiredStringSchema,
    body: requiredStringSchema,
    featuredImage: yup.mixed<FileList>(),
});

type EditPostFormData = yup.InferType<typeof validationSchema>;

//--------------------------------------------------------------------------------------------------------- COMPONENT
interface EditBlogPostPageProps {
    post: BlogPost,
}

export default function EditBlogPostPage({ post }: EditBlogPostPageProps) {
    //----------------------------------------------------------------------------------------------------- Hooks and states
    const { user, userLoading } = useAuthenticatedUser();
    const router = useRouter();
    const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
    const [deletePending, setDeletePending] = useState(false);

    const { register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting, isDirty } } = useForm<EditPostFormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            slug: post.slug,
            title: post.title,
            summary: post.summary,
            body: post.summary,
        }
    });
    useUnsavedChangesWarning(isDirty && !isSubmitting && !deletePending);

    //---------------------------------------------------------------------------------------------------- Internal component functions
    function generateSlugFromTitle() {
        if (getValues("slug")) return;
        const slug = generateSlug(getValues("title"))
        setValue("slug", slug, { shouldValidate: true });
    }

    async function onSubmit({ slug, title, summary, body, featuredImage }: EditPostFormData) {
        try {
            await BlogApi.updateBlogPost(post._id, { slug, title, summary, body, featuredImage: featuredImage?.item(0) || undefined })
            await router.push("/blog/" + slug);
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    async function onDeleteConfirmed() {
        setShowDeleteConfirmationDialog(false);
        setDeletePending(true);
        try {
            await BlogApi.deleteBlogPost(post._id);
            router.push("/blog");
        } catch (error) {
            console.error(error);
            alert(error);
        } finally {
            setDeletePending(false);
        }
    }

    const userIsAuthorized = (user && user._id === post.author._id) || false;

    if (!userLoading && !userIsAuthorized) {
        return <p>You are not authorized to edit this post</p>;
    }

    if (userLoading) {
        return <Spinner animation="border" className="d-block m-auto" />;
    }

    return (
        <div>
            <h1>Edit post</h1>
            {userIsAuthorized &&
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormInputField
                        label="Post title"
                        register={register("title")}
                        placeholder="Post title"
                        maxLength={100}
                        error={errors.title}
                        onBlur={generateSlugFromTitle}
                    />
                    <FormInputField
                        label="Post slug"
                        register={register("slug")}
                        placeholder="Post slug"
                        maxLength={100}
                        error={errors.slug}
                    />
                    <FormInputField
                        label="Post summary"
                        register={register("summary")}
                        placeholder="Post summary"
                        maxLength={300}
                        as="textarea"
                        error={errors.summary}
                    />
                    <FormInputField
                        label="Post image"
                        register={register("featuredImage")}
                        type="file"
                        accept="image/png,image/jpeg"
                        error={errors.featuredImage}
                    />
                    <MarkdownEditor
                        label="Post body"
                        register={register("body")}
                        watch={watch}
                        setValue={setValue}
                        error={errors.body}
                        editorHeight={400}
                    />
                    <div className="d-flex justify-content-between">
                        <LoadingButton
                            type="submit"
                            isLoading={isSubmitting}
                            disabled={deletePending}
                        >
                            Update post
                        </LoadingButton>
                        <Button
                            onClick={() => setShowDeleteConfirmationDialog(true)}
                            variant="outline-danger"
                            disabled={deletePending}
                        >
                            Delete post
                        </Button>
                    </div>

                </Form>
            }
            <ConfirmationModal
                show={showDeleteConfirmationDialog}
                title="Confirm delete"
                message="Do you really want to delete this post?"
                confirmButtonText="Delete"
                onCancel={() => setShowDeleteConfirmationDialog(false)}
                onConfirm={onDeleteConfirmed}
                variant="danger"
            />
        </div>
    );
}