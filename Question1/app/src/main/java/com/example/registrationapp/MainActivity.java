package com.example.registrationapp;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Calendar;
import java.util.regex.Pattern;

public class MainActivity extends AppCompatActivity {

    private EditText editTextName, editTextEmail, editTextDOB, editTextPassword;
    private RadioGroup radioGroupGender;
    private Button buttonRegister;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize views
        editTextName = findViewById(R.id.editTextName);
        editTextEmail = findViewById(R.id.editTextEmail);
        editTextDOB = findViewById(R.id.editTextDOB);
        editTextPassword = findViewById(R.id.editTextPassword);
        radioGroupGender = findViewById(R.id.radioGroupGender);
        buttonRegister = findViewById(R.id.buttonRegister);

        // DatePickerDialog for Date of Birth
        editTextDOB.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showDatePickerDialog();
            }
        });

        // Register button click listener
        buttonRegister.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                validateAndRegister();
            }
        });
    }

    private void showDatePickerDialog() {
        final Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(
                MainActivity.this,
                new DatePickerDialog.OnDateSetListener() {
                    @Override
                    public void onDateSet(DatePicker view, int selectedYear, int selectedMonth, int selectedDay) {
                        // Month is 0-indexed, so add 1
                        String date = selectedDay + "/" + (selectedMonth + 1) + "/" + selectedYear;
                        editTextDOB.setText(date);
                    }
                },
                year, month, day
        );
        datePickerDialog.show();
    }

    private void validateAndRegister() {
        String name = editTextName.getText().toString().trim();
        String email = editTextEmail.getText().toString().trim();
        String dob = editTextDOB.getText().toString().trim();
        String password = editTextPassword.getText().toString().trim();
        int selectedGenderId = radioGroupGender.getCheckedRadioButtonId();

        // Check fields from top to bottom, show only one toast at a time
        if (name.isEmpty()) {
            Toast.makeText(this, "Please enter your name", Toast.LENGTH_SHORT).show();
            return;
        }

        if (email.isEmpty()) {
            Toast.makeText(this, "Please enter your email address", Toast.LENGTH_SHORT).show();
            return;
        }

        // Validate email format
        if (!isValidEmail(email)) {
            Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show();
            return;
        }

        if (selectedGenderId == -1) {
            Toast.makeText(this, "Please select your gender", Toast.LENGTH_SHORT).show();
            return;
        }

        if (dob.isEmpty()) {
            Toast.makeText(this, "Please select your date of birth", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.isEmpty()) {
            Toast.makeText(this, "Password should be at least 8 characters long", Toast.LENGTH_SHORT).show();
            return;
        }

        // Validate password
        if (password.length() < 8) {
            Toast.makeText(this, "Password should be at least 8 characters long", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!isValidPassword(password)) {
            Toast.makeText(this, "Password should contain 1 numeric digit, 1 uppercase letter, and 1 special character", Toast.LENGTH_SHORT).show();
            return;
        }

        // Get selected gender text
        RadioButton selectedGenderButton = findViewById(selectedGenderId);
        String gender = selectedGenderButton.getText().toString();

        // All validations passed — open second activity
        Intent intent = new Intent(MainActivity.this, DisplayActivity.class);
        intent.putExtra("name", name);
        intent.putExtra("email", email);
        intent.putExtra("gender", gender);
        intent.putExtra("dob", dob);
        startActivity(intent);
    }

    private boolean isValidEmail(String email) {
        // A valid email: username@domain.com
        // Username: letters, numbers, underscores, periods, dashes
        // Domain: multiple parts separated by dots
        String emailPattern = "^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        return Pattern.matches(emailPattern, email);
    }

    private boolean isValidPassword(String password) {
        // Must contain at least one numeric digit
        boolean hasDigit = false;
        // Must contain at least one uppercase letter
        boolean hasUppercase = false;
        // Must contain at least one special character from @#$%^&+=!
        boolean hasSpecialChar = false;

        String specialCharacters = "@#$%^&+=!";

        for (char c : password.toCharArray()) {
            if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (Character.isUpperCase(c)) {
                hasUppercase = true;
            } else if (specialCharacters.indexOf(c) != -1) {
                hasSpecialChar = true;
            }
        }

        return hasDigit && hasUppercase && hasSpecialChar;
    }
}
