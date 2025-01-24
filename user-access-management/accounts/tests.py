from django.test import TestCase
from rest_framework.test import APIClient
from accounts.serializers.register_serializer import RegisterSerializer
from accounts.models import CustomUser
from rest_framework.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile


class TestRegisterSerializer(TestCase):

    def setUp(self):
        # Create a user to test duplicate username
        CustomUser.objects.create_user(username="existinguser", password="password123")
        self.valid_data = {
            "username": "testuser",
            "password": "strongpassword123",
            "avatar_url": None
        }
        self.invalid_data_username_taken = {
            "username": "existinguser",
            "password": "strongpassword123",
        }
        self.invalid_data_password_same_as_username = {
            "username": "testuser2",
            "password": "testuser2",
        }
        self.invalid_avatar = SimpleUploadedFile(
            "test.txt", b"Invalid file", content_type="text/plain"
        )

    def test_valid_registration(self):
        serializer = RegisterSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.username, self.valid_data["username"])
        self.assertTrue(user.check_password(self.valid_data["password"]))
        self.assertEqual(user.avatar_url, "avatars/default.png")

    def test_username_already_taken(self):
        serializer = RegisterSerializer(data=self.invalid_data_username_taken)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(
            serializer.errors["username"][0], "This username is already taken."
        )

    def test_password_same_as_username(self):
        serializer = RegisterSerializer(data=self.invalid_data_password_same_as_username)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertEqual(
            serializer.errors["non_field_errors"][0],
            "Password cannot be the same as username."
        )

    # def test_avatar_validation(self):
    #     invalid_data_with_avatar = self.valid_data.copy()
    #     invalid_data_with_avatar["avatar_url"] = self.invalid_avatar

    #     serializer = RegisterSerializer(data=invalid_data_with_avatar)
    #     self.assertFalse(serializer.is_valid())
    #     self.assertIn("avatar_url", serializer.errors)
    #     self.assertEqual(
    #         serializer.errors["avatar_url"][0], "Only JPG, JPEG, and PNG files are allowed."
    #     )

    # def test_avatar_size_limit(self):
    #     # Mock an oversized image file (3MB)
    #     oversized_avatar = SimpleUploadedFile(
    #         "large_image.jpg", b"\x00" * (3 * 1024 * 1024), content_type="image/jpeg"
    #     )
    #     invalid_data_with_avatar = self.valid_data.copy()
    #     invalid_data_with_avatar["avatar_url"] = oversized_avatar

    #     serializer = RegisterSerializer(data=invalid_data_with_avatar)
    #     self.assertFalse(serializer.is_valid())
    #     self.assertIn("avatar_url", serializer.errors)
    #     self.assertEqual(
    #         serializer.errors["avatar_url"][0], "Avatar file size must not exceed 2MB."
    #     )

    def test_invalid_username_format(self):
        invalid_data_with_username = self.valid_data.copy()
        invalid_data_with_username["username"] = "invalid@user!"

        serializer = RegisterSerializer(data=invalid_data_with_username)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(
            serializer.errors["username"][0],
            "Username can only contain letters, numbers, and underscores."
        )

    def test_missing_fields(self):
        serializer = RegisterSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertIn("password", serializer.errors)

    # def test_valid_avatar_upload(self):
    #     valid_avatar = SimpleUploadedFile(
    #         "valid_image.jpg", b"fake_image_data", content_type="image/jpeg"
    #     )
    #     valid_data_with_avatar = self.valid_data.copy()
    #     valid_data_with_avatar["avatar_url"] = valid_avatar

    #     serializer = RegisterSerializer(data=valid_data_with_avatar)
    #     self.assertTrue(serializer.is_valid(), serializer.errors)
    #     user = serializer.save()
    #     self.assertEqual(user.avatar_url.name, f"avatars/{valid_avatar.name}")