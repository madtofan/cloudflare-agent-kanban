import { env } from "@cloudflare-agent-kanban/env/web";

export function getFullImageUrl(
	image: string | null | undefined
): string | undefined {
	if (!image) {
		return undefined;
	}
	if (image.startsWith("http")) {
		return image;
	}
	return env.VITE_R2_PUBLIC_URL
		? `${env.VITE_R2_PUBLIC_URL}/${image}`
		: undefined;
}

export function resizeImage(
	file: File,
	maxWidth: number,
	maxHeight: number
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				let { width, height } = img;

				if (width > height) {
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}
				} else if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.9));
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}
