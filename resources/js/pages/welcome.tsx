import GuestNavbar from "@/components/GuestNavbar";

export default function Welcome() {
    return (
        <div className="min-h-screen bg-gray-50">
            <GuestNavbar />
            <main className="px-6 py-12">
                <div className="flex flex-col items-center justify-center bg-gray-50 px-4">
                    <h1 className="text-3xl font-bold text-center">Welcome to HealthHub</h1>
                </div>
            </main>
        </div>
    );
}
