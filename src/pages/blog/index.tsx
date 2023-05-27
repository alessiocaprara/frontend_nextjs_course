import BlogPostGrid from "@/components/BlogPostsGrid";
import PaginationBar from "@/components/PaginationBar";
import { BlogPostsPage } from "@/models/blog-post";
import * as BlogApi from "@/network/api/blog-api";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { stringify } from "querystring";

export const getServerSideProps: GetServerSideProps<BlogPageProps> = async ({ query }) => {
    const page = parseInt(query.page?.toString() || "1");
    if (page < 1) {
        query.page = "1";
        return {
            redirect: {
                destination: "/blog?" + stringify(query),
                permanent: false,
            }
        }
    }
    const data = await BlogApi.getBlogPosts(page);
    if (data.totalPages > 0 && page > data.totalPages) {
        query.page = data.totalPages.toString();
        return {
            redirect: {
                destination: "/blog?" + stringify(query),
                permanent: false,
            }
        }
    }
    return { props: { data } };
}

interface BlogPageProps {
    data: BlogPostsPage,
}

const BlogPage = ({ data: { posts, page, totalPages } }: BlogPageProps) => {
    const router = useRouter();

    return (
        <>
            <Head>
                <title>Articles | Flow Blog</title>
                <meta name="description" content="Read the latest posts on Flow Blog" />
            </Head>

            <h1>Blog</h1>
            {posts.length > 0 && <BlogPostGrid posts={posts} />}
            <div className="d-flex flex-column align-items-center">
                {posts.length === 0 && <p>No blog posts found</p>}
                {posts.length > 0 && <PaginationBar
                    className="mt-4"
                    currentPage={page}
                    pageCount={totalPages}
                    onPageItemClicked={(page) => {
                        router.push({ query: { ...router.query, page } })
                    }}
                />}
            </div>

        </>
    );
}

export default BlogPage;