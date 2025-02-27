from django.contrib.auth.models import AbstractUser
from django.db import models

#The primary identifier is the id field, which Django automatically creates as an auto-incrementing primary key
#The default username field is set as the unique identifier for authentication
#All the default fields of User model are inherited by the CustomUser model (https://docs.djangoproject.com/en/5.1/ref/contrib/auth/)
class CustomUser(AbstractUser):
    avatar_url = models.CharField(
        # upload_to='avatars/', #this gets added to the MEDIA_ROOT path in settings
        null=True,
        blank=True,
        # default='avatars/default.png'
    )
    status = models.CharField(
        max_length=10,
        choices=[
            ('online', 'Online'),
            ('offline', 'Offline'),
        ],
        default='offline'
    )
    friends = models.ManyToManyField(
        'self', #means the relationship is with the same model (CustomUser)
        blank=True,#for user input validation vs null=True which is for the db (not necessary here though)
        symmetrical=True #indicates mutual relationship (if A is friend of B, then B is friend of A)
    )

    #add Meta class to specify table name, permissions, etc.

    def __str__(self):
        return self.username
