import { Card, CardProps } from "react-bootstrap";
import Link from "next/link";
import { formatDate } from "@/utils/utils";
import { BlogPost } from "@/models/blog-post";
import Image from "next/image";
import UserProfileLink from "./UserProfileLink";

interface BlogPostItemProps {
    post: BlogPost,
    className?: string,
}

const BlogPostItem = ({ post: { slug, title, summary, featuredImageUrl, author, createdAt }, ...props }: BlogPostItemProps & CardProps) => {

    const postLink = "/blog/" + slug;

    return (
        <Card {...props}>
            <article>
                <Link href={postLink}>
                    <Image
                        src={featuredImageUrl}
                        alt="Blog post featured Image"
                        width={576}
                        height={200}
                        className="card-img-top object-fit-cover"
                    />
                </Link>
                <Card.Body>
                    <Card.Title>
                        <Link href={postLink}>
                            {title}
                        </Link>
                    </Card.Title>
                    <Card.Text>{summary}</Card.Text>
                    <Card.Text><UserProfileLink user={author} /></Card.Text>
                    <Card.Text className="text-muted small">
                        <time dateTime={createdAt}>
                            {formatDate(createdAt)}
                        </time>
                    </Card.Text>
                </Card.Body>
            </article>
        </Card>
    );
}

export default BlogPostItem;

/**
 * Checked 25_04_2023 21:09 --> OK
 */