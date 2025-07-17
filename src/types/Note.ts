import { type Category } from "./Category";

export type Note = {
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	id: string;
	transcription?: string;
	category: Category;
}
