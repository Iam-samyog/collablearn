export type Group = {
	id: string;
	name: string;
	isPrivate: boolean;
	ownerId: string;
	memberIds: string[];
	createdAt: number;
	updatedAt: number;
};

