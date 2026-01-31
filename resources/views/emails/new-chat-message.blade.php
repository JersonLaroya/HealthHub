<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
    <p>Hi {{ $chatMessage->receiver->first_name }},</p>

    <p>
        You have unread messages on <strong>HealthHub</strong>
        from
        <strong>
            {{ $chatMessage->sender->first_name }}
            {{ $chatMessage->sender->last_name }}
        </strong>.
    </p>

    <p>
        Please log in to HealthHub to view and reply.
    </p>

    <p>
        <a href="{{ url('/messages') }}">
            Open Messages
        </a>
    </p>

    <p style="font-size: 12px; color: #666;">
        For your privacy, message content is not included in this email.
    </p>
</body>
</html>
