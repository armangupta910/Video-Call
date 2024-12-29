package com.example.webrtc;

public class HangupRequest {
    private String fromUser;
    private String toUser;

    // Getters and Setters
    public String getFromUser() {
        return fromUser;
    }

    public void setFromUser(String fromUser) {
        this.fromUser = fromUser;
    }

    public String getToUser() {
        return toUser;
    }

    public void setToUser(String toUser) {
        this.toUser = toUser;
    }

    // Constructor
    public HangupRequest() {
    }

    public HangupRequest(String fromUser, String toUser) {
        this.fromUser = fromUser;
        this.toUser = toUser;
    }

    @Override
    public String toString() {
        return "HangupRequest{" +
                "fromUser='" + fromUser + '\'' +
                ", toUser='" + toUser + '\'' +
                '}';
    }
}

