'use client';
import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';

type ShareDialogProps = {
	open: boolean;
	onClose: () => void;
	title?: string;
	url: string;
};

export function ShareDialog({ open, onClose, title = 'Invite to group', url }: ShareDialogProps) {
	const canWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			onClose();
		} catch {}
	}
	async function nativeShare() {
		if (!canWebShare) return;
		try {
			// @ts-expect-error web share
			await navigator.share({ title, url });
			onClose();
		} catch {}
	}

	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />
			<div className="relative card p-6 w-[92vw] max-w-sm">
				<div className="text-lg font-semibold">{title}</div>
				<div className="mt-3 flex flex-col items-center gap-3">
					<div className="bg-white p-3 rounded-md">
						<QRCodeSVG value={url} size={180} />
					</div>
					<div className="w-full break-all text-xs text-muted">{url}</div>
					<div className="flex items-center gap-2 w-full">
						<Button onClick={copy} className="flex-1">Copy link</Button>
						<Button onClick={onClose} variant="ghost">Close</Button>
					</div>
					{canWebShare && (
						<Button onClick={nativeShare} variant="secondary" className="w-full">Share…</Button>
					)}
				</div>
			</div>
		</div>
	);
}

