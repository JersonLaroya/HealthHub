import { useForm, usePage } from "@inertiajs/react";

export default function Create() {
    const { auth } = usePage().props;
    const role = auth.user.user_role.name.toLowerCase().replace(" ", "-"); 

    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
    });

    function submit(e) {
        e.preventDefault();
        post(`/events/${role}`);
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Create Event</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Title"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    className="border rounded p-2 w-full"
                />
                {errors.title && <div className="text-red-500">{errors.title}</div>}

                <textarea
                    placeholder="Description"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    className="border rounded p-2 w-full"
                />
                {errors.description && <div className="text-red-500">{errors.description}</div>}

                <input
                    type="datetime-local"
                    value={data.start_at}
                    onChange={(e) => setData("start_at", e.target.value)}
                    className="border rounded p-2 w-full"
                />
                {errors.start_at && <div className="text-red-500">{errors.start_at}</div>}

                <input
                    type="datetime-local"
                    value={data.end_at}
                    onChange={(e) => setData("end_at", e.target.value)}
                    className="border rounded p-2 w-full"
                />
                {errors.end_at && <div className="text-red-500">{errors.end_at}</div>}

                <button
                    type="submit"
                    disabled={processing}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Save
                </button>
            </form>
        </div>
    );
}
