// File Name: TeamInviteCard.jsx
// Purpose: Display and manage team invitations
// Written for beginner developers

const TeamInviteCard = ({ invite, onAccept, onDecline }) => {
    return (
        <div className="flex justify-between items-center bg-white p-4 rounded shadow mb-2">
            <div>
                <p className="font-bold">{invite.teamName}</p>
                <p className="text-sm text-gray-500">Invited by: {invite.inviter}</p>
            </div>
            <div className="space-x-2">
                <button onClick={onAccept} className="text-green-600 hover:text-green-800 font-medium">Accept</button>
                <button onClick={onDecline} className="text-red-600 hover:text-red-800 font-medium">Decline</button>
            </div>
        </div>
    );
};

export default TeamInviteCard;
