package com.example.mapwebapp;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

public class MapsActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap mMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // Define the three locations
        LatLng kelowna = new LatLng(49.8801, -119.4436);
        LatLng ubco = new LatLng(49.9394, -119.3948);
        LatLng lakeCountry = new LatLng(50.0537, -119.4106);

        // Add markers with titles (shown when marker is clicked)
        mMap.addMarker(new MarkerOptions().position(kelowna).title("Kelowna"));
        mMap.addMarker(new MarkerOptions().position(ubco).title("UBCO"));
        mMap.addMarker(new MarkerOptions().position(lakeCountry).title("Lake Country"));

        // Move camera to Kelowna with zoom level 10
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(kelowna, 10));

        // Enable zoom controls (Zoom in/out buttons at bottom-right corner)
        mMap.getUiSettings().setZoomControlsEnabled(true);
    }
}
