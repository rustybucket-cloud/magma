import { type Category } from "./Category";

export type Note = {
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	transcription?: string;
	category: Category;
}
