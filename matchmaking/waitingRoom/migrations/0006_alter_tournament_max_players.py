# Generated by Django 5.0.9 on 2025-01-31 14:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('waitingRoom', '0005_alter_match_match_id_alter_tournament_tournament_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournament',
            name='max_players',
            field=models.IntegerField(choices=[(4, '4 Players'), (8, '8 Players')]),
        ),
    ]
