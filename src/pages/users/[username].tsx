import profilePicPlaceholder from "@/assets/images/profile-pic-placeholder.png";
import BlogPostGrid from "@/components/BlogPostsGrid";
import LoadingButton from "@/components/LoadingButton";
import PaginationBar from "@/components/PaginationBar";
import FormInputField from "@/components/form/FormInputField";
import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { User } from "@/models/user";
import * as BlogApi from "@/network/api/blog-api";
import * as UsersApi from "@/network/api/user-api";
import { NotFoundError } from "@/network/http-errors";
import styles from "@/styles/UserProfilePage.module.css";
import { formatDate } from "@/utils/utils";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import * as yup from "yup";

export const getServerSideProps: GetServerSideProps<UserProfilePageProps> = async ({ params }) => {
    try {
        const username = params?.username?.toString();
        if (!username) throw Error("username missing");
        const user = await UsersApi.getUserByUsername(username);
        return { props: { user } };
    } catch (error) {
        if (error instanceof NotFoundError) {
            return { notFound: true }
        } else {
            throw error
        }
    }
}

interface UserProfilePageProps {
    user: User,
}

export default function UserProfilePage({ user }: UserProfilePageProps) {
    return (
        <UserProfile user={user} key={user._id} />
    );
}

const UserProfile = ({ user }: UserProfilePageProps) => {
    const { user: loggedInUser, mutateUser: mutateLoggedInUser } = useAuthenticatedUser();
    const [profileUser, setProfileUser] = useState(user);

    const profileUserIsLoggedInUser = (loggedInUser && (loggedInUser._id === profileUser._id)) || false;

    function handleUserUpdated(updatedUser: User) {
        mutateLoggedInUser(updatedUser);
        setProfileUser(updatedUser);
    }

    return (
        <>
            <Head>
                <title>{`${profileUser.username} | Flow Blog`}</title>
            </Head>
            <div>
                <UserInfoSection user={profileUser} />
                {profileUserIsLoggedInUser &&
                    <>
                        <hr />
                        <UpdateUserProfileSection onUserUpdated={handleUserUpdated} />
                    </>
                }
                <hr />
                <UserBlogPostSection user={profileUser} />
            </div>
        </>
    );
}

interface UserInfoSectionProps {
    user: User,
}

function UserInfoSection({ user: { username, displayName, profilePicUrl, about, createdAt } }: UserInfoSectionProps) {
    return (
        <Row>
            <Col sm="auto">
                <Image
                    src={profilePicUrl || profilePicPlaceholder}
                    width={200}
                    height={200}
                    alt={"Profile picture user: " + username} // TODO: username could be undefined?
                    priority
                    className={`rounded ${styles.profilePic}`}
                />
            </Col>
            <Col className="mt-2 mt-sm-0">
                <h1>{displayName}</h1>
                <div><strong>Username: </strong>{username}</div>
                <div><strong>User since: </strong>{formatDate(createdAt)}</div>
                <div className="pre-line"><strong>About me: </strong><br />{about || "This user hasn't share any info yet"}</div>
            </Col>
        </Row>
    );
}

const validationSchema = yup.object({
    displayName: yup.string(),
    about: yup.string(),
    profilePic: yup.mixed<FileList>(),
});

type UpdateUserProfileFormData = yup.InferType<typeof validationSchema>;

interface UpdateUserProfileSectionProps {
    onUserUpdated: (updatedUser: User) => void,
}

function UpdateUserProfileSection({ onUserUpdated }: UpdateUserProfileSectionProps) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<UpdateUserProfileFormData>();

    async function onSubmit({ displayName, about, profilePic }: UpdateUserProfileFormData) {
        if (!displayName && !about && (!profilePic || profilePic.length === 0)) return;
        try {
            const updatedUser = await UsersApi.updateUser({ displayName, about, profilePic: profilePic?.item(0) || undefined });
            onUserUpdated(updatedUser);

        } catch (error) {
            console.error(error); // TODO: Frontend better error handling
            alert(error);
        }
    }

    return (
        <div>
            <h2>Update profile</h2>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormInputField
                    register={register("displayName")}
                    label="Display name"
                    placeholder="Display name"
                    maxLength={20}
                />
                <FormInputField
                    register={register("about")}
                    label="About me"
                    placeholder="Tell us a few things about you"
                    maxLength={160}
                    as="textarea"
                />
                <FormInputField
                    register={register("profilePic")}
                    type="file"
                    accept="image/png,image/jpeg"
                    label="Profile picture"
                />
                <LoadingButton type="submit" isLoading={isSubmitting}>Update profile</LoadingButton>
            </Form>
        </div>
    );
}

interface UserBlogPostSectionProps {
    user: User,
}

function UserBlogPostSection({ user }: UserBlogPostSectionProps) { // Client side rendering with SWR

    const [page, setPage] = useState(1);
    const { data, isLoading: blogPostsLoading, error: blogPostsLoadingError } =
        useSWR([user._id, page, "user_posts"], ([userId, page]) => BlogApi.getBlogPostsByUser(userId, page));

    const blogPosts = data?.posts || [];
    const totalPages = data?.totalPages || 0;

    return (
        <div>
            <h2>Blog post</h2>
            {blogPosts.length > 0 && <BlogPostGrid posts={blogPosts} />}
            <div className="d-flex flex-column align-items-center">
                {blogPosts.length > 0 && <PaginationBar
                    currentPage={page}
                    pageCount={totalPages}
                    onPageItemClicked={(page) => setPage(page)}
                    className="mt-4"
                />}
                {blogPostsLoading && <Spinner animation="border" />}
                {blogPostsLoadingError && <p>Blog posts could not be loaded</p>}
                {!blogPostsLoading && !blogPostsLoadingError && blogPosts.length === 0 &&
                    <p>This user hasn&apos;t posted anything yet</p>
                }
            </div>
        </div>
    );
}

/*
Comments [13/05/2023]
   - Controllare i TODO
   - Funzionamento generale di Bootstrap
   - styling
   - Update profile section better management (non credo sia necessario gestire gli errori di validazione dei campi ma 
     all'aggiornamento del profilo utente i campi si dovrebbero sbiancare e dovrebbe apprarire un messaggio di conferma/errore
*/