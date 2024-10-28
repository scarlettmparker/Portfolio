export const PAGE_LENGTH: number = 10;

export const fetchNumUsers = async (setNumUsers: (value: number) => void) => {
    try {
        // fetch number of users available
        const response = await fetch('/api/guidedreader/admin/user/getuserlength', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update count
        const data = await response.json();
        setNumUsers(data.userCount);
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};

export const fetchUserData = async (pageIndex: number, setUsers: (value: any[]) => void) => {
    try {
        // fetch user data
        const response = await fetch(`/api/guidedreader/admin/user/getusers?pageIndex=${pageIndex}&pageLength=${PAGE_LENGTH}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get response and update users
        const data = await response.json();
        setUsers(data);
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};
