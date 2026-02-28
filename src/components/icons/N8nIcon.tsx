/**
 * n8n logo icon component — renders the recolored_icon.svg from /public
 */
import Image from "next/image";

interface N8nIconProps {
    className?: string;
}

export function N8nIcon({ className = "size-6" }: N8nIconProps) {
    return (
        <Image
            src="/recolored_icon.svg"
            alt="n8n"
            width={24}
            height={24}
            className={className}
        />
    );
}
