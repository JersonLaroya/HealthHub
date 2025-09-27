import { useForm, usePage } from "@inertiajs/react";

export default function Edit({ event }) {
    const { auth } = usePage().props;
    const role = auth.user.user_role.name.toLowerCase().replace(" ", "-"); 

    const { data, setData, put, processing, errors } = useForm({
        title: event.title || "",
        description: event.description || "",
        start_at: event.start_at || "",
        end_at: event.end_at || "",
    });

    function submit(e) {
        e.preventDefault();
        put(`/events/${role}/${event.id}`);
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Edit Event</h1>
            <form onSubmit={submit} className="space-y-4">
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    className="border rounded p-2 w-full"
                />
                {errors.title && <div className="text-red-500">{errors.title}</div>}

                <textarea
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
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Update
                </button>
            </form>
        </div>
    );
}
