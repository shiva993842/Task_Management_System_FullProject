# auth_app/views.py
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import check_password

class RegisterView(APIView):
    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Registration successful',
                    'token': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'message': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Use authenticate with username
            auth_user = authenticate(username=user.username, password=password)
            
            if auth_user is not None:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'token': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                })
            else:
                return Response({
                    'message': 'Invalid password'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception:
            return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email
        })

    def put(self, request):
        user = request.user
        username = request.data.get('username')
        email = request.data.get('email')

        try:
            # Check if username is being changed and is unique
            if username and username != user.username:
                if User.objects.filter(username=username).exists():
                    return Response(
                        {'message': 'Username already taken'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.username = username

            # Check if email is being changed and is unique
            if email and email != user.email:
                if User.objects.filter(email=email).exists():
                    return Response(
                        {'message': 'Email already taken'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.email = email

            user.save()
            return Response({
                'username': user.username,
                'email': user.email,
                'message': 'Profile updated successfully'
            })
        except Exception as e:
            return Response(
                {'message': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'message': 'Both current and new password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'message': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password changed successfully'})
        except Exception as e:
            return Response(
                {'message': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
