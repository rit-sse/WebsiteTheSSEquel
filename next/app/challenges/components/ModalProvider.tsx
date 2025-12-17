"use client";

import { X } from "lucide-react";
import {
    PropsWithChildren,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type ModalOptions = {
    title?: ReactNode;
    description?: ReactNode;
    input?: boolean;
    cancelBtnText?: string;
    submitBtnText?: string;
};

export type ModalResult = { submitted: false } | { submitted: true; code: string; language: string };

type ModalContextValue = {
    openModal: (options: ModalOptions) => Promise<ModalResult>;
    closeModal: (result?: ModalResult) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: PropsWithChildren) {
    const [options, setOptions] = useState<ModalOptions | null>(null);
    const [code, setCode] = useState<string>("");
    const [language, setLanguage] = useState<string>("python");

    // store the resolve function of the pending promise
    // in a ref to avoid re-rendering
    const resolveRef = useRef<((value: ModalResult) => void) | null>(null);

    const isOpen = options !== null;

    const closeModal = useCallback(
        (result?: ModalResult) => {
            const resolve = resolveRef.current;
            resolveRef.current = null;

            setOptions(null);
            setCode("");
            setLanguage("python");
            resolve?.(result ?? { submitted: false });
        },
        []
    );

    const openModal = useCallback((nextOptions: ModalOptions) => {
        resolveRef.current?.({ submitted: false });

        setOptions(nextOptions);
        setCode("");
        setLanguage("python");

        return new Promise<ModalResult>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    // press escape to close
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeModal({ submitted: false });
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [closeModal, isOpen]);

    // cleanup
    useEffect(() => {
        return () => {
            resolveRef.current?.({ submitted: false });
            resolveRef.current = null;
        };
    }, []);

    const context = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

    const cancelText = options?.cancelBtnText ?? "Cancel";
    const submitText = options?.submitBtnText ?? "Submit";

    return (
        <ModalContext.Provider value={context}>
            {children}

            {options ? (
                <dialog open className="modal" onClose={() => closeModal({ submitted: false })}>
                    <div className="modal-box">
                        <button
                            type="button"
                            aria-label="Close modal"
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                            onClick={() => closeModal({ submitted: false })}
                        >
                            <X />
                        </button>
                        
                        {options.title}
                        {options.description}

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => closeModal({ submitted: false })}>
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => closeModal({ submitted: true, code, language })}
                            >
                                {submitText}
                            </button>
                        </div>
                    </div>

                    <form className="modal-backdrop bg-black/50">
                        <button type="button" aria-label="Close modal" className="hover:cursor-default" onClick={() => closeModal({ submitted: false })} />
                    </form>
                </dialog>
            ) : null}
        </ModalContext.Provider>
    );
}

export function useModal(): ModalContextValue {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within <ModalProvider />");
    return ctx;
}