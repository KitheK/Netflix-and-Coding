package com.example.registrationapp;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class DisplayActivity extends AppCompatActivity {

    private TextView textViewName, textViewEmail, textViewGender, textViewDOB;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_display);

        // Initialize views
        textViewName = findViewById(R.id.textViewName);
        textViewEmail = findViewById(R.id.textViewEmail);
        textViewGender = findViewById(R.id.textViewGender);
        textViewDOB = findViewById(R.id.textViewDOB);

        // Get data from intent
        String name = getIntent().getStringExtra("name");
        String email = getIntent().getStringExtra("email");
        String gender = getIntent().getStringExtra("gender");
        String dob = getIntent().getStringExtra("dob");

        // Display the information (password is NOT shown)
        textViewName.setText(name);
        textViewEmail.setText(email);
        textViewGender.setText(gender);
        textViewDOB.setText(dob);
    }
}
