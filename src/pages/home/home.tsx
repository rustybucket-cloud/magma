import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Note } from "@/types"

const notes: Note[] = [
	{
		title: "Note 1",
		content: "This is a note",
		createdAt: new Date(),
		updatedAt: new Date(),
		id: "1",
		category: {
			id: "1",
			name: "Personal",
		},
	},
	{
		title: "Note 2",
		content: "This is another note",
		createdAt: new Date(),
		updatedAt: new Date(),
		id: "2",
		category: {
			id: "2",
			name: "Work",
		},
	},
]

console.log(notes)

export default function Home() {
  return (
    <main className="container">
	<h1 className="text-3xl">Notes</h1>
	<div className="flex gap-4 items-end">
		<Input placeholder="Search..." className="h-12 px-4 py-2 mt-4 max-w-md" />
		<Select className="h-12">
			<SelectTrigger className="w-[180px] h-12 px-4 py-2 mt-4 max-w-md">
				<SelectValue placeholder="Category" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="light">Light</SelectItem>
				<SelectItem value="dark">Dark</SelectItem>
				<SelectItem value="system">System</SelectItem>
			</SelectContent>
		</Select>
	</div>
	<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
		{notes.map((note) => (
			<Card key={note.id} class="volcanic-card">
				<CardHeader>
					<CardTitle className="text-xl">{note.title}</CardTitle>
				</CardHeader>
				<CardFooter>
					{note.category.name}
				</CardFooter>
			</Card>
		))}
	</div>
    </main>
  );
}
