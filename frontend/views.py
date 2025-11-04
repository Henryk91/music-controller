from django.shortcuts import render

def index(requests, *args, **kwargs):
    return render(requests, 'frontend/index.html')