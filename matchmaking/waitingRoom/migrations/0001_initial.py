# Generated by Django 5.0.9 on 2025-01-17 11:31

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Match',
            fields=[
                ('match_id', models.BigIntegerField(editable=False, primary_key=True, serialize=False)),
                ('player_1_id', models.BigIntegerField()),
                ('player_2_id', models.BigIntegerField(blank=True, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('active', 'Active'), ('finished', 'Finished')], db_index=True, default='pending', max_length=10)),
            ],
            options={
                'indexes': [models.Index(fields=['player_1_id', 'player_2_id'], name='waitingRoom_player__78ac49_idx'), models.Index(fields=['status'], name='waitingRoom_status_2f3266_idx')],
            },
        ),
    ]
