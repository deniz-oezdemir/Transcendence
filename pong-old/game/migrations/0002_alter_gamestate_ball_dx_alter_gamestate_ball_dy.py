# Generated by Django 5.1 on 2024-11-20 17:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamestate',
            name='ball_dx',
            field=models.IntegerField(default=3),
        ),
        migrations.AlterField(
            model_name='gamestate',
            name='ball_dy',
            field=models.IntegerField(default=3),
        ),
    ]
