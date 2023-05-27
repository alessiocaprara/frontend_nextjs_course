import { Col, Row } from "react-bootstrap";
import BlogPostItem from "./BlogPostItem";
import { BlogPost } from "@/models/blog-post";
import styles from "@/styles/BlogPostsGrid.module.css";

interface BlogPostsGridProps {
    posts: BlogPost[],
}

const BlogPostGrid = ({ posts }: BlogPostsGridProps) => {
    return (
        <Row xs={1} sm={2} lg={3} className="g-4">
            {posts.map(post => (
                <Col key={post._id}>
                    <BlogPostItem post={post} className={styles.entry} />
                </Col>
            ))}
        </Row>
    )
}

export default BlogPostGrid;

/**
 * Checked 25_04_2023 21:14 --> OK
 */