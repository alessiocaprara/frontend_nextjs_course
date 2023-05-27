import * as UserApi from "@/network/api/user-api";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import LoadingButton from "../LoadingButton";
import FormInputField from "../form/FormInputField";
import PasswordInputField from "../form/PasswordInputField";
import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import { useState } from "react";
import { BadRequestError, ConflictError } from "@/network/http-errors";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { emailSchema, passwordSchema, requiredStringSchema, usernameSchema } from "@/utils/validation";
import SocialSignInSection from "./SocialSignInSection";
import useCountdown from "@/hooks/useCountdown";

const validationSchema = yup.object({
    username: usernameSchema.required("Required"),
    email: emailSchema.required("Required"),
    password: passwordSchema.required("Required"),
    verificationCode: requiredStringSchema,
});

type SignUpFormaData = yup.InferType<typeof validationSchema>;

interface SignUpModalProps {
    onDismiss: () => void,
    onLoginInsteadClicked: () => void,
}

const SignUpModal = ({ onDismiss, onLoginInsteadClicked }: SignUpModalProps) => {

    const { mutateUser } = useAuthenticatedUser();

    const [verificationCodeRequestPending, setVerificationCodeRequestPending] = useState(false);
    const [showVerificationCodeSentText, setShowVerificationCodeSentText] = useState(false);
    const { secondsLeft, start } = useCountdown();

    const [errorText, setErrorText] = useState<string | null>(null);

    const { register, handleSubmit, getValues, trigger, formState: { errors, isSubmitting } } = useForm<SignUpFormaData>({
        resolver: yupResolver(validationSchema),
    });

    async function onSubmit(credentials: SignUpFormaData) {
        try {
            setErrorText(null);
            setShowVerificationCodeSentText(false);
            const newUser = await UserApi.signUp(credentials);
            mutateUser(newUser);
            onDismiss();
        } catch (error) {
            if (error instanceof ConflictError || error instanceof BadRequestError) {
                setErrorText(error.message);
            } else {
                console.error(error);
                alert(error);
            }
        }
    }

    async function requestVerificationCode() {
        const validEmailInput = await trigger("email");
        if (!validEmailInput) return;
        const emailInput = getValues("email");
        setErrorText(null);
        setShowVerificationCodeSentText(false);
        setVerificationCodeRequestPending(true);
        try {
            await UserApi.requestEmailVerificationCode(emailInput);
            setShowVerificationCodeSentText(true);
            start(60);
        } catch (error) {
            if (error instanceof ConflictError) {
                setErrorText(error.message);
            } else {
                console.error(error);
                alert(error);
            }
        } finally {
            setVerificationCodeRequestPending(false);
        }
    }

    return (
        <Modal show onHide={onDismiss} centered>
            <Modal.Header closeButton>
                <Modal.Title>Sign Up</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {errorText &&
                    <Alert variant="danger">{errorText}</Alert>
                }
                {showVerificationCodeSentText &&
                    <Alert variant="warning">We sent you a verification code. Please check your inbox</Alert>
                }
                <Form onSubmit={handleSubmit(onSubmit)} noValidate> {/* noValidate to avoid native browser validation */}
                    <FormInputField
                        register={register("username")}
                        label="Username"
                        placeholder="Username"
                        maxLength={50}
                        error={errors.username}
                    />
                    <FormInputField
                        register={register("email")}
                        type="email"
                        label="Email"
                        placeholder="Email"
                        maxLength={50}
                        error={errors.email}
                    />
                    <PasswordInputField
                        register={register("password")}
                        label="Password"
                        placeholder="Password"
                        error={errors.password}
                    />
                    <FormInputField
                        register={register("verificationCode")}
                        label="Verification code"
                        placeholder="Verification code"
                        type="number"
                        error={errors.verificationCode}
                        inputGroupElement={
                            <Button
                                id="button-send-verification-code"
                                disabled={verificationCodeRequestPending || secondsLeft > 0}
                                onClick={requestVerificationCode}
                            >
                                Send code
                                {secondsLeft > 0 && ` (${secondsLeft})`}
                            </Button>
                        }
                    />
                    <LoadingButton
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-100"
                    >
                        Sign Up
                    </LoadingButton>
                </Form>
                <hr />
                <SocialSignInSection />
                <div className="d-flex align-items-center gap-1 justify-content-center mt-1">
                    Already have an account?
                    <Button variant="link" onClick={onLoginInsteadClicked}>
                        Log in
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default SignUpModal;