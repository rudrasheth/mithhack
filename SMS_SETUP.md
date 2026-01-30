# How to Configure "SMS Forwarder" (Step-by-Step)

## 1. Add a "Sender" (The Destination)
Most apps separate the "Destination" from the "Rule". You need to define **Where** to send first.

1.  Look for a tab called **Senders** or **Recipients** or **Forward To**.
2.  Tap the **Plus (+)** button to add new.
3.  Choose Type: **Webhook** or **HTTP**.
4.  **Fill these details**:
    *   **Name**: `Laptop Backend`
    *   **Web URL**: `http://10.200.129.90:5001/api/ingest/sms`
    *   **Method**: `POST` (Default)
    *   **Content Type**: `application/json` (if asked)
    *   **JSON Template / Body**:
        ```json
        {
          "message": "%body%",
          "sender": "%address%"
        }
        ```
        *(Note: ` %body%` and `%address%` might be different buttons in your app. Look for "Insert Variable").*
5.  **Tap TEST**. If you get "200 OK", it works!

## 2. Add a "Rule" (The Trigger)
1.  Go to the **Home** or **Rules/Filters** tab.
2.  Tap **Plus (+)**.
3.  **From**: Select "All" (or specific number).
4.  **Forward To**: Select the `Laptop Backend` sender you just created.
5.  Save.

## 3. Real Test
Send an SMS to your phone. It should appear on the Laptop Dashboard!
