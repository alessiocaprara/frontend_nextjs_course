import useAuthenticatedUser from "@/hooks/useAuthenticatedUser";
import useCountdown from "@/hooks/useCountdown";
import * as UserApi from "@/network/api/user-api";
import { BadRequestError, ConflictError, NotFoundError } from "@/network/http-errors";
import { emailSchema, passwordSchema, requiredStringSchema } from "@/utils/validation";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import LoadingButton from "../LoadingButton";
import FormInputField from "../form/FormInputField";
import PasswordInputField from "../form/PasswordInputField";
import SocialSignInSection from "./SocialSignInSection";

const validationSchema = yup.object({
    email: emailSchema.required("Required"),
    password: passwordSchema.required("Required"),
    verificationCode: requiredStringSchema,
});

type ResetPasswordFormaData = yup.InferType<typeof validationSchema>;

interface ResetPasswordModalProps {
    onDismiss: () => void,
    onSignUpClicked: () => void,
}

const ResetPasswordModal = ({ onDismiss, onSignUpClicked }: ResetPasswordModalProps) => {

    const { mutateUser } = useAuthenticatedUser();

    const [verificationCodeRequestPending, setVerificationCodeRequestPending] = useState(false);
    const [showVerificationCodeSentText, setShowVerificationCodeSentText] = useState(false);
    const { secondsLeft, start } = useCountdown();

    const [errorText, setErrorText] = useState<string | null>(null);

    const { register, handleSubmit, getValues, trigger, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormaData>({
        resolver: yupResolver(validationSchema),
    });

    async function onSubmit(credentials: ResetPasswordFormaData) {
        try {
            setErrorText(null);
            setShowVerificationCodeSentText(false);
            const user = await UserApi.resetPassword(credentials);
            mutateUser(user);
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
            await UserApi.requestPasswordResetCode(emailInput);
            setShowVerificationCodeSentText(true);
            start(60);
        } catch (error) {
            if (error instanceof NotFoundError) {
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
                <Modal.Title>Reset password</Modal.Title>
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
                        register={register("email")}
                        type="email"
                        label="Email"
                        placeholder="Email"
                        maxLength={50}
                        error={errors.email}
                    />
                    <PasswordInputField
                        register={register("password")}
                        label="New password"
                        placeholder="New password"
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
                        Log in
                    </LoadingButton>
                </Form>
                <div className="d-flex align-items-center gap-1 justify-content-center mt-1">
                    Don&apos;t have an account yet?
                    <Button variant="link" onClick={onSignUpClicked}>
                        Sign up
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default ResetPasswordModal;