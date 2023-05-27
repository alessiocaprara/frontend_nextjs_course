import { ReactNode } from "react";
import { Button, ButtonProps, Spinner } from "react-bootstrap";

interface LoadingButtonProps {
    isLoading: boolean,
    children: ReactNode,
}

const LoadingButton = ({ isLoading, children, ...props }: LoadingButtonProps & ButtonProps) => {
    return (
        <Button {...props} disabled={isLoading}>
            {isLoading &&
                <>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                    <span className="visually-hidden">Loading...</span>
                    {" "}
                </>
            }
            {children}
        </Button>
    );
}

export default LoadingButton;

/**
 * Checked 27_04_2023 21:50 --> OK
 */