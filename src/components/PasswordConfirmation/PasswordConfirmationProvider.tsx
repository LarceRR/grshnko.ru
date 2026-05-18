import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Button, Input, Modal, Space, Typography } from "antd";
import {
  confirmCurrentPassword,
  registerPasswordConfirmationHandler,
} from "../../security/passwordChallenge";

interface PendingConfirmation {
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

interface PasswordConfirmationProviderProps {
  children: ReactNode;
}

export const PasswordConfirmationProvider = ({
  children,
}: PasswordConfirmationProviderProps) => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pendingRef = useRef<PendingConfirmation | null>(null);

  const requestConfirmation = useCallback(() => {
    setPassword("");
    setError(null);
    setOpen(true);
    return new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
    });
  }, []);

  useEffect(() => {
    return registerPasswordConfirmationHandler(requestConfirmation);
  }, [requestConfirmation]);

  const closeWithRejection = useCallback(() => {
    pendingRef.current?.reject(new Error("Password confirmation cancelled"));
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const submit = useCallback(async () => {
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmCurrentPassword(password);
      pendingRef.current?.resolve();
      pendingRef.current = null;
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password confirmation failed");
    } finally {
      setSubmitting(false);
    }
  }, [password, submitting]);

  return (
    <>
      {children}
      <Modal
        title="Confirm your identity"
        open={open}
        onCancel={closeWithRejection}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Text>
            Enter your account password to continue this sensitive action.
          </Typography.Text>
          {error ? <Alert type="error" showIcon message={error} /> : null}
          <Input.Password
            autoFocus
            value={password}
            status={error ? "error" : undefined}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            onPressEnter={submit}
          />
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={closeWithRejection} disabled={submitting}>
              Cancel
            </Button>
            <Button type="primary" onClick={submit} loading={submitting}>
              Confirm
            </Button>
          </Space>
        </Space>
      </Modal>
    </>
  );
};
